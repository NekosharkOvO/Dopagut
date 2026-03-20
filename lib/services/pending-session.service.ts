import { supabase } from '../supabase-client';

/** 数据库中的未完成记录会话 */
export interface DbPendingSession {
    id: string;
    user_id: string;
    started_at: string;
    mood: string | null;
    created_at: string;
}

/**
 * 未完成记录会话服务
 *
 * NOTE: 独立于 logs 表管理进行中的记录。用户点击「开始投弹」时创建，
 * 记录完成后删除。如果页面被意外销毁，pending session 留存数据库，
 * 用户下次打开时可选择恢复、补录或放弃。
 */
export const pendingSessionService = {
    /**
     * 创建一条新的未完成会话
     * @param userId 用户 ID
     * @param startedAt 开始时间的 ISO 字符串
     * @param mood 可选的初始心情状态
     */
    async createSession(
        userId: string,
        startedAt: string,
        mood?: string
    ): Promise<DbPendingSession> {
        // NOTE: 创建前先清理该用户可能残留的旧 session，确保同一用户只有一条
        await supabase
            .from('pending_sessions')
            .delete()
            .eq('user_id', userId);

        const { data, error } = await supabase
            .from('pending_sessions')
            .insert({
                user_id: userId,
                started_at: startedAt,
                mood: mood || null,
            })
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    /**
     * 查询用户是否有未完成的记录会话
     * @param userId 用户 ID
     * @returns 未完成的会话，如果没有则返回 null
     */
    async getActiveSession(
        userId: string
    ): Promise<DbPendingSession | null> {
        const { data, error } = await supabase
            .from('pending_sessions')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

        if (error) throw error;
        return data;
    },

    /**
     * 删除一条未完成会话（完成记录或用户放弃时调用）
     * @param sessionId 会话 ID
     */
    async deleteSession(sessionId: string): Promise<void> {
        const { error } = await supabase
            .from('pending_sessions')
            .delete()
            .eq('id', sessionId);

        if (error) throw error;
    },

    /**
     * 根据用户 ID 删除所有未完成会话
     * NOTE: 用于保存记录后的清理，避免因 ID 传递问题导致残留
     * @param userId 用户 ID
     */
    async deleteAllSessions(userId: string): Promise<void> {
        const { error } = await supabase
            .from('pending_sessions')
            .delete()
            .eq('user_id', userId);

        if (error) throw error;
    },
};
