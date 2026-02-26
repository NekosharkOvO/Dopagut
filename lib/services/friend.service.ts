import { supabase } from '../supabase-client';
import { Profile } from './auth.service';

export const friendService = {
    async getFriendsWithProfiles(userId: string): Promise<Profile[]> {
        const { data, error } = await supabase
            .from('friends')
            .select('friend_id')
            .eq('user_id', userId);
        if (error) throw error;

        if (!data || data.length === 0) return [];

        const friendIds = data.map((f: any) => f.friend_id);
        const { data: profiles, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .in('id', friendIds);
        if (profileError) throw profileError;

        return profiles || [];
    },

    async getLeaderboard(limit = 20): Promise<Profile[]> {
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .order('total_drops', { ascending: false })
            .limit(limit);
        if (error) throw error;
        return data || [];
    },
};
