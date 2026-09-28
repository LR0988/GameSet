import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase, db } from '../utils/supabase';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  displayName: string;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, displayName: string) => Promise<{ error: Error | null }>;
  quickPlay: (nickname: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  updateDisplayName: (name: string) => Promise<{ error: Error | null }>;
  resetPassword: (email: string) => Promise<{ error: Error | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [displayName, setDisplayName] = useState<string>('');

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        const metaName = session.user.user_metadata?.display_name || session.user.email?.split('@')[0] || '';
        setDisplayName(metaName);
      }
      setLoading(false);
    });

    // Listen for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        const metaName = session.user.user_metadata?.display_name || session.user.email?.split('@')[0] || '';
        setDisplayName(metaName);
      } else {
        setDisplayName('');
      }
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) return { error };
      if (data.user) {
        const name = data.user.user_metadata?.display_name || email.split('@')[0];
        setDisplayName(name);
      }
      return { error: null };
    } catch (err: unknown) {
      return { error: err as Error };
    }
  };

  const signUp = async (email: string, password: string, name: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            display_name: name || email.split('@')[0],
          },
        },
      });
      if (error) return { error };
      if (data.user) {
        setDisplayName(name || email.split('@')[0]);
        await db.saveProfile(data.user, name);

        // Immediate login attempt to activate session without waiting for email verification
        if (!data.session) {
          const res = await supabase.auth.signInWithPassword({ email, password });
          if (res.data.session) {
            setSession(res.data.session);
            setUser(res.data.user);
          }
        }
      }
      return { error: null };
    } catch (err: unknown) {
      return { error: err as Error };
    }
  };

  const quickPlay = async (nickname: string) => {
    try {
      const cleanNick = nickname.trim() || '大腦挑戰者';
      const randomId = Math.random().toString(36).substring(2, 9);
      const guestEmail = `player_${randomId}@gameset.local`;
      const guestPass = `pass_${randomId}_${Date.now()}`;

      const { data, error } = await supabase.auth.signUp({
        email: guestEmail,
        password: guestPass,
        options: {
          data: { display_name: cleanNick },
        },
      });

      if (!error && data.user) {
        setDisplayName(cleanNick);
        setUser(data.user);
        if (data.session) setSession(data.session);
        await db.saveProfile(data.user, cleanNick);
      } else {
        setDisplayName(cleanNick);
      }
      return { error: null };
    } catch (err: unknown) {
      return { error: err as Error };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setDisplayName('');
  };

  const updateDisplayName = async (name: string) => {
    try {
      const { data, error } = await supabase.auth.updateUser({
        data: { display_name: name },
      });
      if (error) return { error };
      if (data.user) {
        setDisplayName(name);
        await db.saveProfile(data.user, name);
      }
      return { error: null };
    } catch (err: unknown) {
      return { error: err as Error };
    }
  };

  const resetPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      return { error };
    } catch (err: unknown) {
      return { error: err as Error };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        displayName,
        signIn,
        signUp,
        quickPlay,
        signOut,
        updateDisplayName,
        resetPassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
