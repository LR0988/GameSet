import { createClient, User } from '@supabase/supabase-js';

const DEFAULT_SUPABASE_URL = 'https://qoyevxtxzaohdygcbtcv.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFveWV2eHR4emFvaGR5Z2NidGN2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA1MjQyMDQsImV4cCI6MjEwNjEwMDIwNH0.5Il6EaBpFlo_Ag3PSiEyQdieibX-WCqc4uFveKpPt2g';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || DEFAULT_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || DEFAULT_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

export interface UserProfile {
  id: string;
  email: string;
  displayName: string;
  avatarUrl?: string;
  createdAt: string;
}

export interface CloudScore {
  id?: string;
  userId: string;
  userEmail: string;
  displayName: string;
  gameId: string;
  score: number;
  details?: Record<string, unknown>;
  createdAt?: string;
}

// Database helper functions
export const db = {
  // Sync score to Supabase
  async saveScore(userId: string, userEmail: string, displayName: string, gameId: string, score: number, details?: Record<string, unknown>) {
    try {
      const { error } = await supabase.from('game_scores').insert([
        {
          user_id: userId,
          user_email: userEmail,
          display_name: displayName || userEmail.split('@')[0],
          game_id: gameId,
          score,
          details: details || {},
        },
      ]);
      if (error) {
        // Table might not be created yet, log silently
        console.warn('Supabase game_scores save notice:', error.message);
      }
    } catch (e) {
      console.warn('Cloud sync error:', e);
    }
  },

  // Fetch top leaderboard for a game
  async getLeaderboard(gameId: string, limit = 10): Promise<CloudScore[]> {
    try {
      const { data, error } = await supabase
        .from('game_scores')
        .select('*')
        .eq('game_id', gameId)
        .order('score', { ascending: false })
        .limit(limit);

      if (error || !data) return [];
      return data.map(item => ({
        id: item.id,
        userId: item.user_id,
        userEmail: item.user_email,
        displayName: item.display_name,
        gameId: item.game_id,
        score: item.score,
        details: item.details,
        createdAt: item.created_at,
      }));
    } catch {
      return [];
    }
  },

  // Sync user profile
  async saveProfile(user: User, displayName: string) {
    try {
      await supabase.from('profiles').upsert([
        {
          id: user.id,
          email: user.email,
          display_name: displayName,
          updated_at: new Date().toISOString(),
        },
      ]);
    } catch {
      // Ignore if table not set up
    }
  },
};
