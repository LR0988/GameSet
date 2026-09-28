import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase, db } from '../utils/supabase';
import { storage } from '../utils/storage';
import { SavedUser } from '../types';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  displayName: string;
  savedUsers: SavedUser[];
  showAuthModal: boolean;
  setShowAuthModal: (show: boolean) => void;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, displayName: string) => Promise<{ error: Error | null }>;
  quickPlay: (nickname: string) => Promise<{ error: Error | null; user?: SavedUser }>;
  loginAsSavedUser: (savedUser: SavedUser) => Promise<void>;
  removeSavedUser: (id: string) => void;
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
  const [savedUsers, setSavedUsers] = useState<SavedUser[]>([]);
  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);

  // Refresh saved users from storage
  const refreshSavedUsers = useCallback(() => {
    const list = storage.getSavedUsers();
    setSavedUsers(list);
    return list;
  }, []);

  useEffect(() => {
    const users = refreshSavedUsers();

    // Check if user has already entered in this browser session
    const sessionEntered = typeof window !== 'undefined' ? sessionStorage.getItem('gameset_user_entered') : 'true';

    // 1. Check Supabase session first
    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      if (currentSession?.user) {
        setSession(currentSession);
        setUser(currentSession.user);
        const metaName = currentSession.user.user_metadata?.display_name || currentSession.user.email?.split('@')[0] || '會員';
        setDisplayName(metaName);
        storage.setActiveUserId(currentSession.user.id);
      } else {
        // 2. Check if a local saved user was active
        const activeId = storage.getActiveUserId();
        const activeUser = users.find(u => u.id === activeId) || users[0];

        if (activeUser) {
          loginAsSavedUser(activeUser, false);
        }
      }

      // Do not auto-block screen with modal. Users pick directly on top bar!
      setShowAuthModal(false);

      setLoading(false);
    });

    // Listen for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session?.user) {
        setUser(session.user);
        const metaName = session.user.user_metadata?.display_name || session.user.email?.split('@')[0] || '';
        setDisplayName(metaName);
        storage.setActiveUserId(session.user.id);
      }
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [refreshSavedUsers]);

  // Log in as a saved free user profile
  const loginAsSavedUser = async (savedUser: SavedUser, markSessionEntered = true) => {
    const userObj: User = {
      id: savedUser.id,
      email: savedUser.email,
      app_metadata: {},
      user_metadata: {
        display_name: savedUser.displayName,
        is_guest: savedUser.isGuest,
        avatar_color: savedUser.avatarColor,
      },
      aud: 'authenticated',
      created_at: new Date(savedUser.lastLoginAt).toISOString(),
    } as User;

    setUser(userObj);
    setDisplayName(savedUser.displayName);
    storage.setActiveUserId(savedUser.id);

    if (markSessionEntered && typeof window !== 'undefined') {
      sessionStorage.setItem('gameset_user_entered', 'true');
      setShowAuthModal(false);
    }

    // Update last login timestamp
    const updated = { ...savedUser, lastLoginAt: Date.now() };
    storage.saveUser(updated);
    refreshSavedUsers();
  };

  const removeSavedUser = (id: string) => {
    storage.removeSavedUser(id);
    refreshSavedUsers();
    if (user?.id === id) {
      setUser(null);
      setDisplayName('');
    }
  };

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

        const profile: SavedUser = {
          id: data.user.id,
          displayName: name,
          email: data.user.email || email,
          isGuest: false,
          avatarColor: storage.getRandomAvatarGradient(),
          lastLoginAt: Date.now(),
        };
        storage.saveUser(profile);
        refreshSavedUsers();
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('gameset_user_entered', 'true');
        }
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
        const cleanName = name || email.split('@')[0];
        setDisplayName(cleanName);
        await db.saveProfile(data.user, cleanName);

        if (!data.session) {
          const res = await supabase.auth.signInWithPassword({ email, password });
          if (res.data.session) {
            setSession(res.data.session);
            setUser(res.data.user);
          }
        }

        const profile: SavedUser = {
          id: data.user.id,
          displayName: cleanName,
          email: data.user.email || email,
          isGuest: false,
          avatarColor: storage.getRandomAvatarGradient(),
          lastLoginAt: Date.now(),
        };
        storage.saveUser(profile);
        refreshSavedUsers();
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('gameset_user_entered', 'true');
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
      const avatarColor = storage.getRandomAvatarGradient();

      let createdUser: User | null = null;

      try {
        const { data, error } = await supabase.auth.signUp({
          email: guestEmail,
          password: guestPass,
          options: {
            data: { display_name: cleanNick, is_guest: true },
          },
        });
        if (!error && data.user) {
          createdUser = data.user;
          if (data.session) setSession(data.session);
          await db.saveProfile(data.user, cleanNick);
        }
      } catch {
        // Fallback to local user
      }

      const userId = createdUser?.id || `guest_${randomId}`;

      const savedUser: SavedUser = {
        id: userId,
        displayName: cleanNick,
        email: guestEmail,
        isGuest: true,
        avatarColor,
        lastLoginAt: Date.now(),
      };

      storage.saveUser(savedUser);
      refreshSavedUsers();
      await loginAsSavedUser(savedUser, true);

      return { error: null, user: savedUser };
    } catch (err: unknown) {
      return { error: err as Error };
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch {
      // Ignore
    }
    storage.setActiveUserId(null);
    setUser(null);
    setSession(null);
    setDisplayName('');
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('gameset_user_entered');
    }
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
      if (user) {
        const saved = storage.getSavedUsers().find(u => u.id === user.id);
        if (saved) {
          storage.saveUser({ ...saved, displayName: name });
          refreshSavedUsers();
        }
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
        savedUsers,
        showAuthModal,
        setShowAuthModal,
        signIn,
        signUp,
        quickPlay,
        loginAsSavedUser,
        removeSavedUser,
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
