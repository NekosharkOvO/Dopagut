import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
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
    /** 是否检测到跨标签页身份认证冲突 */
    authConflict: boolean;
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
    const [authConflict, setAuthConflict] = useState(false);

    /**
     * 加载用户档案
     * 认证成功后自动调用，获取 profiles 表中的完整数据。
     * 如果记录不存在则尝试创建一个（修复死锁）。
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

    // NOTE: 标志位，区分用户主动退出和跨标签页被动 SIGNED_OUT
    const isSigningOutRef = React.useRef(false);

    // 初始化：检查现有会话 + 监听认证状态变化
    useEffect(() => {
        let mounted = true;
        let authCurrentUserId: string | null = null;

        // =============================================
        // 跨标签页冲突检测核心机制
        // =============================================
        // NOTE: 使用 localStorage 中的「标签页注册表」让所有标签页互相感知对方的 userId。
        // 每个标签页在登录成功后将自己的 tabId→userId 写入注册表；
        // 定时轮询检查注册表中是否存在不同的 userId → 存在则显示 Banner。
        // 这比事件驱动更可靠，因为延迟死锁场景中不一定会触发 storage/authStateChange 事件。

        const TAB_REGISTRY_KEY = 'dopagut_tab_registry';
        const TAB_USER_KEY = 'dopagut_tab_user_id';
        // 每个标签页的唯一 ID（用 sessionStorage 保证 tab 级隔离）
        const tabId = sessionStorage.getItem('dopagut_tab_id') || `tab_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
        sessionStorage.setItem('dopagut_tab_id', tabId);

        /**
         * 将本标签页的 userId 注册到全局注册表中
         * 同时清理超过 30 秒未心跳的过期标签页
         */
        const registerTab = (userId: string) => {
            try {
                const registry: Record<string, { userId: string; ts: number }> =
                    JSON.parse(localStorage.getItem(TAB_REGISTRY_KEY) || '{}');
                // 写入/更新本标签页
                registry[tabId] = { userId, ts: Date.now() };
                // 清理超过 30 秒未更新的过期条目
                const cutoff = Date.now() - 30000;
                for (const key of Object.keys(registry)) {
                    if (registry[key].ts < cutoff) delete registry[key];
                }
                localStorage.setItem(TAB_REGISTRY_KEY, JSON.stringify(registry));
            } catch (_e) { /* localStorage 满或不可用时静默忽略 */ }
        };

        /**
         * 检查注册表中是否存在与本标签页不同 userId 的活跃标签页
         */
        const checkRegistryConflict = (): boolean => {
            if (!authCurrentUserId) return false;
            try {
                const registry: Record<string, { userId: string; ts: number }> =
                    JSON.parse(localStorage.getItem(TAB_REGISTRY_KEY) || '{}');
                const cutoff = Date.now() - 30000;
                for (const [key, entry] of Object.entries(registry)) {
                    if (key === tabId) continue;
                    // 只对比 30 秒内活跃的标签页
                    if (entry.ts >= cutoff && entry.userId !== authCurrentUserId) {
                        return true;
                    }
                }
            } catch (_e) { }
            return false;
        };

        /** 注销本标签页（页面卸载时调用） */
        const unregisterTab = () => {
            try {
                const registry = JSON.parse(localStorage.getItem(TAB_REGISTRY_KEY) || '{}');
                delete registry[tabId];
                localStorage.setItem(TAB_REGISTRY_KEY, JSON.stringify(registry));
            } catch (_e) { }
        };

        // 终极防死锁机制：10 秒内重载 ≥2 次则直接触发
        const RELOAD_KEY = 'dopagut_tab_reload_count';
        const now = Date.now();
        const reloadInfo = JSON.parse(sessionStorage.getItem(RELOAD_KEY) || '{"count":0, "time":0}');
        let isDeadlocked = false;

        if (now - reloadInfo.time < 10000) {
            if (reloadInfo.count >= 2) {
                isDeadlocked = true;
                setAuthConflict(true);
                console.error('💥 灾难级防卡死机制触发！');
                sessionStorage.setItem(RELOAD_KEY, JSON.stringify({ count: 0, time: 0 }));
                setLoading(false);
            } else {
                sessionStorage.setItem(RELOAD_KEY, JSON.stringify({ count: reloadInfo.count + 1, time: now }));
            }
        } else {
            sessionStorage.setItem(RELOAD_KEY, JSON.stringify({ count: 1, time: now }));
        }

        /**
         * 标记跨标签页冲突并显示 Banner
         */
        const flagAuthConflict = () => {
            if (!mounted) return;
            console.warn('⚠️ 检测到跨标签页身份认证冲突，显示提示 Banner');
            setAuthConflict(true);
            setLoading(false);
        };

        const initAuth = async () => {
            if (isDeadlocked) return;

            // NOTE: 超时后只结束 loading spinner，不中断 authTask。
            // authTask 会继续在后台完成 user/profile 的加载。
            const loadingTimeout = setTimeout(() => {
                if (mounted) {
                    console.warn('initAuth 加载超时，先结束 loading spinner');
                    setLoading(false);
                }
            }, 4000);

            try {
                const session = await authService.getSession();
                if (session?.user && mounted) {
                    // 检查本 Tab 之前绑定的 userId 是否被篡改
                    const previousTabUserId = sessionStorage.getItem(TAB_USER_KEY);
                    if (previousTabUserId && previousTabUserId !== session.user.id) {
                        flagAuthConflict();
                        return;
                    }

                    authCurrentUserId = session.user.id;
                    sessionStorage.setItem(TAB_USER_KEY, session.user.id);
                    setUser(session.user);
                    registerTab(session.user.id);
                    await loadProfile(session.user.id);

                    if (checkRegistryConflict()) {
                        flagAuthConflict();
                    }
                }
            } catch (err) {
                console.error('初始化认证失败:', err);
            } finally {
                clearTimeout(loadingTimeout);
                if (mounted) setLoading(false);
            }
        };

        initAuth();

        if (isDeadlocked) {
            return;
        }

        // NOTE: 定时轮询注册表 + 心跳更新（每 3 秒）
        // 这是最可靠的检测层：即使 storage 事件漏掉、延迟死锁逐渐产生，也能捕获
        const pollIntervalId = setInterval(() => {
            if (!mounted || !authCurrentUserId) return;
            // 心跳更新本标签页的注册信息
            registerTab(authCurrentUserId);
            // 检查是否有冲突
            if (checkRegistryConflict()) {
                flagAuthConflict();
            }
        }, 3000);

        // 监听 localStorage 变更（即时响应层）
        const handleStorageChange = (e: StorageEvent) => {
            // 注册表变更 → 立即检查冲突
            if (e.key === TAB_REGISTRY_KEY && authCurrentUserId) {
                if (checkRegistryConflict()) {
                    flagAuthConflict();
                }
                return;
            }

            // Supabase auth token 变更
            const isSupabaseAuthKey = e.key && (
                (e.key.startsWith('sb-') && e.key.endsWith('-auth-token')) ||
                e.key.includes('supabase.auth.token')
            );
            if (!isSupabaseAuthKey) return;

            if (!e.newValue && authCurrentUserId) {
                flagAuthConflict();
                return;
            }
            if (e.newValue && authCurrentUserId) {
                try {
                    const parsed = JSON.parse(e.newValue);
                    const newUserId = parsed?.user?.id;
                    if (newUserId && newUserId !== authCurrentUserId) {
                        flagAuthConflict();
                    }
                } catch (_e) { }
            }
        };
        window.addEventListener('storage', handleStorageChange);

        // 页面切回可见时立即检查
        const handleVisibilityChange = () => {
            if (document.visibilityState !== 'visible' || !authCurrentUserId) return;
            registerTab(authCurrentUserId);
            if (checkRegistryConflict()) {
                flagAuthConflict();
            }
        };
        document.addEventListener('visibilitychange', handleVisibilityChange);

        // 页面关闭时注销本标签页
        window.addEventListener('beforeunload', unregisterTab);

        // 监听认证事件（登录/退出/Token 刷新等）
        const { data: { subscription } } = authService.onAuthStateChange(
            async (event: string, session: Session | null) => {
                if (!mounted) return;

                if (event === 'SIGNED_IN' && session?.user) {
                    if (authCurrentUserId && authCurrentUserId !== session.user.id) {
                        flagAuthConflict();
                        return;
                    }

                    sessionStorage.setItem(RELOAD_KEY, JSON.stringify({ count: 0, time: 0 }));
                    authCurrentUserId = session.user.id;
                    sessionStorage.setItem(TAB_USER_KEY, session.user.id);
                    // 登录成功后注册到标签页注册表
                    registerTab(session.user.id);
                    setUser(session.user);
                    await loadProfile(session.user.id, session.user.user_metadata?.name);

                    // 登录后立即检查是否与其他标签页冲突
                    if (checkRegistryConflict()) {
                        flagAuthConflict();
                    }
                } else if (event === 'SIGNED_OUT') {
                    // NOTE: 只有「非主动退出」时才判定为跨标签页冲突
                    // isSigningOutRef 在 signOut() 中被设为 true，表示是用户主动退出
                    if (authCurrentUserId && !isSigningOutRef.current) {
                        flagAuthConflict();
                        return;
                    }
                    isSigningOutRef.current = false;
                    authCurrentUserId = null;
                    sessionStorage.removeItem(TAB_USER_KEY);
                    unregisterTab();
                    setUser(null);
                    setProfile(null);
                } else if (event === 'TOKEN_REFRESHED' && session?.user) {
                    if (authCurrentUserId && session.user.id !== authCurrentUserId) {
                        flagAuthConflict();
                        return;
                    }
                    setUser(session.user);
                    loadProfile(session.user.id).catch(e => console.warn('TOKEN_REFRESHED loadProfile failed:', e));
                }
            }
        );

        return () => {
            mounted = false;
            clearInterval(pollIntervalId);
            window.removeEventListener('storage', handleStorageChange);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('beforeunload', unregisterTab);
            subscription.unsubscribe();
        };
    }, [loadProfile]);

    const signIn = async (email: string, password: string) => {
        const { user: signedInUser } = await authService.signIn(email, password);
        if (signedInUser) {
            setUser(signedInUser);
            // NOTE: loadProfile 加保护，防止出错时 signIn 整体抛异常导致界面崩溃
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
                    // 首次失败后等待并重试一次
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

    const signOut = async () => {
        // 标记为主动退出，防止 SIGNED_OUT 事件处理器误判为冲突
        isSigningOutRef.current = true;
        await authService.signOut();
        setUser(null);
        setProfile(null);
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                profile,
                loading,
                emailConfirmed: !!user?.email_confirmed_at,
                authConflict,
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
