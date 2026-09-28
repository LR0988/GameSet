import React, { useState } from 'react';
import { GameId } from './types';
import { Navbar } from './components/Navbar';
import { NBackGame } from './games/nback/NBackGame';
import { StroopGame } from './games/stroop/StroopGame';
import { Game2048 } from './games/game2048/Game2048';
import { SnakeGame } from './games/snake/SnakeGame';
import { sound } from './utils/sound';
import { AuthProvider } from './context/AuthContext';

import { UserAndGameBar } from './components/common/UserAndGameBar';

export const AppContent: React.FC = () => {
  const [activeGame, setActiveGame] = useState<GameId>('nback');
  const [isMuted, setIsMuted] = useState<boolean>(sound.getMuted());

  const handleToggleMute = () => {
    const nextMuted = !isMuted;
    sound.setMuted(nextMuted);
    setIsMuted(nextMuted);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 selection:bg-indigo-500 selection:text-white">
      {/* Top Navbar with Auth & Leaderboard */}
      <Navbar
        activeGame={activeGame}
        onSelectGame={setActiveGame}
        isMuted={isMuted}
        onToggleMute={handleToggleMute}
      />

      {/* Main Content Arena */}
      <main className="flex-1 flex flex-col items-center justify-start py-4 px-2 sm:px-4">
        {/* Direct 1-Click User & Game Selection Strip */}
        <UserAndGameBar
          activeGame={activeGame}
          onSelectGame={setActiveGame}
        />

        {activeGame === 'nback' && <NBackGame />}
        {activeGame === 'stroop' && <StroopGame />}
        {activeGame === 'game2048' && <Game2048 />}
        {activeGame === 'snake' && <SnakeGame />}
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
