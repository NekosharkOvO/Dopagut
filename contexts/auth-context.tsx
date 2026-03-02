import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { authService, profileService, Profile } from '../lib/api';
import type { User, Session } from '@supabase/supabase-js';

// =============================================
// 类型定义
// =============================================

interface AuthContextType {
    /** Supabase 用户对象（null 表示未登录） */
    user: User | null;
    /** 用户档案数据 */
    profile: Profile | null;
    /** 是否正在加载初始状态 */
    loading: boolean;
    /** 邮箱是否已确认 */
    emailConfirmed: boolean;
    /** 登录 */
    signIn: (email: string, password: string) => Promise<void>;
    /** 注册（支持邀请码和位置） */
    signUp: (email: string, password: string, name: string, inviteCode?: string, location?: string, geo?: { lat: number; lng: number }) => Promise<void>;
    /** 退出登录 */
    signOut: () => Promise<void>;
    /** 刷新 profile 数据 */
    refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// =============================================
// Provider 组件
// =============================================

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [profile, setProfile] = useState<Profile | null>(null);
    const [loading, setLoading] = useState(true);

    /**
     * 加载用户档案
     * 认证成功后自动调用，获取 profiles 表中的完整数据。
     * 如果记录不存在则尝试创建一个。
     */
    const loadProfile = useCallback(async (userId: string, name?: string) => {
        try {
            const data = await profileService.ensureProfile(userId, name);
            setProfile(data);
        } catch (err) {
            console.error('确保用户档案失败:', err);
        }
    }, []);

    /**
     * 刷新 profile（供子组件调用，例如修改用户名后）
     */
    const refreshProfile = useCallback(async () => {
        if (user) {
            await loadProfile(user.id);
        }
    }, [user, loadProfile]);

    // NOTE: 标志位，区分用户主动退出和 Supabase 内部触发的 SIGNED_OUT
    const isSigningOutRef = useRef(false);

    // =============================================
    // 核心认证逻辑：「不与 Supabase 争 Lock」架构
    // =============================================
    //
    // NOTE: 死锁根因（第三次排查确认）——
    // Supabase v2.96 GoTrueClient 使用 _acquireLock + pendingInLock 队列机制。
    // 当 visibilitychange 触发 Supabase 内部的 _onVisibilityChanged：
    //   1. 获取 lock → _recoverAndRefresh → _callRefreshToken（成功，200）
    //   2. _notifyAllSubscribers('TOKEN_REFRESHED') —— await 所有回调
    //   3. 如果回调中 await 了 Supabase API（如 loadProfile 内部的查询）
    //      → 这些 API 也需要获取同一个 lock → 被放入 pendingInLock
    //   4. 外层 lock 等待 pendingInLock 完成 → pendingInLock 等待回调完成
    //      → 回调等待 API 完成 → API 被 pendingInLock 阻塞 = 💀 死锁
    //
    // 解决方案：
    //   - onAuthStateChange 回调中只做内存状态更新（setUser/setProfile）
    //   - loadProfile 等 Supabase API 调用用 setTimeout(0) 推迟到 lock 释放后
    //   - 不注册自己的 visibilitychange handler（让 Supabase 独自管理）
    //   - 不在回调中调用 refreshSession（会争 lock）
    //
    useEffect(() => {
        let mounted = true;

        // NOTE: 清理旧版冲突检测机制遗留的数据
        try {
            localStorage.removeItem('dopagut_tab_registry');
            sessionStorage.removeItem('dopagut_tab_id');
            sessionStorage.removeItem('dopagut_tab_user_id');
            sessionStorage.removeItem('dopagut_tab_reload_count');
        } catch (_e) { /* ignore */ }

        /**
         * 初始化认证状态
         * 从 Supabase 获取当前 session，如果有则加载 profile
         */
        const initAuth = async () => {
            try {
                const session = await authService.getSession();
                if (session?.user && mounted) {
                    setUser(session.user);
                    await loadProfile(session.user.id);
                }
            } catch (err) {
                console.error('初始化认证失败:', err);
            } finally {
                if (mounted) {
                    setLoading(false);
                }
            }
        };

        initAuth();

        // =============================================
        // 监听 Supabase 认证事件
        // =============================================
        // NOTE: 核心规则——回调中 **绝不 await 任何 Supabase API 调用**
        // 因为回调是在 Supabase lock 内执行的（_notifyAllSubscribers 会 await 回调）
        // 如果在回调中调用需要 lock 的 API → 死锁
        const { data: { subscription } } = authService.onAuthStateChange(
            (event: string, session: Session | null) => {
                if (!mounted) return;

                if (event === 'SIGNED_IN' && session?.user) {
                    setUser(session.user);
                    // NOTE: loadProfile 放到 setTimeout(0) 中，
                    // 让当前 notifyAllSubscribers 先完成并释放 lock，
                    // 之后 loadProfile 的 Supabase 查询才能正常获取 lock
                    setTimeout(() => {
                        if (!mounted) return;
                        loadProfile(session.user.id, session.user.user_metadata?.name);
                    }, 0);
                } else if (event === 'SIGNED_OUT') {
                    if (isSigningOutRef.current) {
                        // 用户主动退出 → 清空
                        isSigningOutRef.current = false;
                        setUser(null);
                        setProfile(null);
                    }
                    // NOTE: 非主动 SIGNED_OUT → 完全忽略。
                    // 原因：Supabase visibilitychange 恢复失败可能触发假事件
                    // 且此时 session 已被从 localStorage 删除，
                    // 调 getSession 验证必然为 null → 误清状态。
                    // 不做任何操作，保持现有 user/profile 状态。
                } else if (event === 'TOKEN_REFRESHED' && session?.user) {
                    // NOTE: token 刷新成功（visibilitychange 恢复时的常见事件）
                    // 只更新 user 对象（新 token），不做任何异步操作
                    setUser(session.user);
                    // NOTE: 静默刷新 profile —— 同样推迟到 lock 释放后
                    setTimeout(() => {
                        if (!mounted) return;
                        loadProfile(session.user.id).catch(() => { });
                    }, 0);
                } else if (event === 'INITIAL_SESSION' && session?.user) {
                    // NOTE: Supabase v2 初始化完成信号
                    setUser(session.user);
                }
            }
        );

        return () => {
            mounted = false;
            subscription.unsubscribe();
        };
    }, [loadProfile]);

    const signIn = async (email: string, password: string) => {
        const { user: signedInUser } = await authService.signIn(email, password);
        if (signedInUser) {
            setUser(signedInUser);
            try {
                await Promise.race([
                    loadProfile(signedInUser.id),
                    new Promise((_, reject) => setTimeout(() => reject(new Error('signIn loadProfile timeout')), 5000))
                ]);
            } catch (e) {
                console.warn('signIn 中 loadProfile 失败:', e);
            }
        }
    };

    const signUp = async (email: string, password: string, name: string, inviteCode?: string, location?: string, geo?: { lat: number; lng: number }) => {
        const { user: newUser } = await authService.signUp(email, password, name);
        if (newUser) {
            setUser(newUser);
            // NOTE: 数据库触发器自动创建 profile，等待足够时间确保行已存在
            await new Promise(resolve => setTimeout(resolve, 1500));

            // 确保 profile 存在（防止触发器延迟）
            await profileService.ensureProfile(newUser.id, name);

            // 注册后补充写入地理位置和 GPS 坐标
            const profileUpdates: Record<string, any> = {};
            if (location) profileUpdates.location = location;
            if (geo) {
                profileUpdates.geo_lat = geo.lat;
                profileUpdates.geo_lng = geo.lng;
            }
            if (Object.keys(profileUpdates).length > 0) {
                await profileService.updateProfile(newUser.id, profileUpdates);
            }

            // 邀请码处理：加入圈子（带一次重试）
            if (inviteCode) {
                const tryJoin = async () => {
                    await profileService.joinGroup(inviteCode);
                };
                try {
                    await tryJoin();
                } catch (e) {
                    console.warn('邀请码首次加入失败，500ms 后重试:', e);
                    await new Promise(resolve => setTimeout(resolve, 500));
                    try {
                        await tryJoin();
                    } catch (e2) {
                        console.error('邀请码加入圈子最终失败:', e2);
                    }
                }
            }

            await loadProfile(newUser.id);
        }
    };

    /**
     * 退出登录
     * NOTE: 添加 3 秒超时保护，即使 Supabase 请求 hang 住也能强制清理本地状态。
     */
    const signOut = async () => {
        isSigningOutRef.current = true;

        const forceCleanup = () => {
            setUser(null);
            setProfile(null);
        };

        try {
            await Promise.race([
                authService.signOut(),
                new Promise((_, reject) => setTimeout(() => reject(new Error('signOut timeout')), 3000))
            ]);
        } catch (err) {
            console.warn('signOut 超时或失败，强制清理本地状态:', err);
        } finally {
            forceCleanup();
        }
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                profile,
                loading,
                emailConfirmed: !!user?.email_confirmed_at,
                signIn,
                signUp,
                signOut,
                refreshProfile
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

// =============================================
// Hook
// =============================================

/**
 * 获取认证上下文
 * 必须在 AuthProvider 内部使用
 */
export function useAuth(): AuthContextType {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth 必须在 AuthProvider 内部使用');
    }
    return context;
}
