import React, { useState, useEffect } from 'react';
import { GameId, SavedUser } from './types';
import { Navbar } from './components/Navbar';
import { NBackGame } from './games/nback/NBackGame';
import { StroopGame } from './games/stroop/StroopGame';
import { Game2048 } from './games/game2048/Game2048';
import { SnakeGame } from './games/snake/SnakeGame';
import { sound } from './utils/sound';
import { AuthProvider, useAuth } from './context/AuthContext';
import { InitialUserPicker } from './components/auth/InitialUserPicker';

export const AppContent: React.FC = () => {
  const [activeGame, setActiveGame] = useState<GameId>('nback');
  const [isMuted, setIsMuted] = useState<boolean>(sound.getMuted());
  const { user, loginAsSavedUser } = useAuth();

  const [hasEntered, setHasEntered] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem('gameset_user_entered') === 'true';
    }
    return false;
  });

  // If user signs out and becomes null, reset entered state so initial picker is shown
  useEffect(() => {
    if (!user) {
      if (typeof window !== 'undefined') {
        const flag = sessionStorage.getItem('gameset_user_entered');
        if (flag !== 'true') {
          setHasEntered(false);
        }
      }
    }
  }, [user]);

  const handleToggleMute = () => {
    const nextMuted = !isMuted;
    sound.setMuted(nextMuted);
    setIsMuted(nextMuted);
  };

  const handleInitialEnter = (savedUser: SavedUser) => {
    loginAsSavedUser(savedUser);
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('gameset_user_entered', 'true');
    }
    setHasEntered(true);
    sound.playClick();
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 selection:bg-indigo-500 selection:text-white">
      {/* Top Navbar with Auth, Leaderboard & Game Tabs */}
      <Navbar
        activeGame={activeGame}
        onSelectGame={setActiveGame}
        isMuted={isMuted}
        onToggleMute={handleToggleMute}
      />

      {/* Main Content Arena */}
      <main className="flex-1 flex flex-col items-center justify-start py-2 sm:py-3 px-2 sm:px-4">
        {!hasEntered ? (
          /* 1. Only shown at initial login/entry: 1-click user selection */
          <InitialUserPicker onEnter={handleInitialEnter} />
        ) : (
          /* 2. Direct game view (no redundant body game selector, full clean focus) */
          <>
            {activeGame === 'nback' && <NBackGame />}
            {activeGame === 'stroop' && <StroopGame />}
            {activeGame === 'game2048' && <Game2048 />}
            {activeGame === 'snake' && <SnakeGame />}
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="w-full py-4 border-t border-slate-900 bg-slate-950 text-center text-xs text-slate-500">
        <p>Game Set © 2026 · Powered by Supabase Auth & Cloud Database · Ready for Vercel</p>
      </footer>
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App;

