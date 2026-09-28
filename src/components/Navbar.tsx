import React, { useState } from 'react';
import { GameId } from '../types';
import { useAuth } from '../context/AuthContext';
import { Brain, Zap, Grid3X3, Gamepad2, Volume2, VolumeX, User, LogIn, Trophy, TrendingUp } from 'lucide-react';
import { AuthModal } from './auth/AuthModal';
import { UserProfileModal } from './auth/UserProfileModal';
import { LeaderboardModal } from './leaderboard/LeaderboardModal';
import { AnalyticsModal } from './analytics/AnalyticsModal';

interface NavbarProps {
  activeGame: GameId;
  onSelectGame: (game: GameId) => void;
  isMuted: boolean;
  onToggleMute: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeGame,
  onSelectGame,
  isMuted,
  onToggleMute,
}) => {
  const { user, displayName, showAuthModal, setShowAuthModal } = useAuth();
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState(false);
  const [isAnalyticsOpen, setIsAnalyticsOpen] = useState(false);

  const games: { id: GameId; label: string; icon: React.ReactNode; tag?: string }[] = [
    { id: 'nback', label: 'N-Back 記憶訓練', icon: <Brain className="w-4 h-4" />, tag: '大腦核心' },
    { id: 'stroop', label: '斯特魯普測驗', icon: <Zap className="w-4 h-4" /> },
    { id: 'game2048', label: '2048', icon: <Grid3X3 className="w-4 h-4" /> },
    { id: 'snake', label: '經典貪食蛇', icon: <Gamepad2 className="w-4 h-4" /> },
  ];

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between gap-3">
          {/* Logo / Brand */}
          <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => onSelectGame('nback')}>
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-500 to-cyan-400 flex items-center justify-center font-black text-white shadow-lg shadow-indigo-500/20 text-base">
              GS
            </div>
            <div>
              <h1 className="font-extrabold text-base sm:text-lg text-white tracking-wide leading-none flex items-center gap-1.5">
                Game Set
                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  腦力遊戲集
                </span>
              </h1>
              <p className="text-[10px] text-slate-400 leading-tight">N-Back Brain Training & Mini Games</p>
            </div>
          </div>

          {/* Game Switcher Tabs */}
          <nav className="hidden md:flex items-center gap-1.5 bg-slate-900/90 p-1 rounded-xl border border-slate-800">
            {games.map(g => (
              <button
                key={g.id}
                onClick={() => onSelectGame(g.id)}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
                  activeGame === g.id
                    ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                {g.icon}
                <span>{g.label}</span>
                {g.tag && (
                  <span className="text-[9px] px-1 rounded bg-indigo-400/30 text-indigo-200">
                    {g.tag}
                  </span>
                )}
              </button>
            ))}
          </nav>

          {/* Global Controls & Links */}
          <div className="flex items-center gap-2">
            {/* Analytics button */}
            <button
              onClick={() => setIsAnalyticsOpen(true)}
              title="腦力分數趨勢與統計分析"
              className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-indigo-400 hover:bg-slate-850 transition flex items-center gap-1.5 text-xs font-semibold"
            >
              <TrendingUp className="w-4 h-4 text-indigo-400" />
              <span className="hidden sm:inline text-slate-300">統計分析</span>
            </button>

            {/* Leaderboard button */}
            <button
              onClick={() => setIsLeaderboardOpen(true)}
              title="全球腦力排行榜"
              className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-amber-400 hover:bg-slate-850 transition flex items-center gap-1.5 text-xs font-semibold"
            >
              <Trophy className="w-4 h-4 text-amber-400" />
              <span className="hidden sm:inline text-slate-300">排行榜</span>
            </button>

            {/* Sound Toggle */}
            <button
              onClick={onToggleMute}
              title={isMuted ? '開啟音效' : '靜音'}
              className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-850 transition"
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-indigo-400" />}
            </button>

            {/* User Auth Section */}
            {user ? (
              <button
                onClick={() => setIsProfileOpen(true)}
                className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-xl bg-indigo-950/60 border border-indigo-500/40 text-indigo-200 hover:bg-indigo-900/60 transition"
              >
                <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-indigo-500 to-cyan-400 text-white font-black text-xs flex items-center justify-center">
                  {(displayName || user.email || 'U')[0].toUpperCase()}
                </div>
                <span className="text-xs font-bold max-w-[80px] sm:max-w-[110px] truncate">
                  {displayName || '會員'}
                </span>
              </button>
            ) : (
              <button
                onClick={() => setIsAuthOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white font-bold text-xs shadow-md shadow-indigo-500/20 transition active:scale-95"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>登入 / 註冊</span>
              </button>
            )}

            {/* GitHub Repo */}
            <a
              href="https://github.com/LR0988/GameSet"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-850 transition hidden sm:flex"
              title="GitHub Repository"
            >
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
              </svg>
            </a>
          </div>
        </div>

        {/* Mobile Game Switcher Bar */}
        <div className="flex md:hidden overflow-x-auto px-4 py-2 border-t border-slate-800/60 gap-1.5 bg-slate-900/50">
          {games.map(g => (
            <button
              key={g.id}
              onClick={() => onSelectGame(g.id)}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                activeGame === g.id
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-400 hover:text-slate-200 bg-slate-800/40'
              }`}
            >
              {g.icon}
              <span>{g.label}</span>
            </button>
          ))}
        </div>
      </header>

      {/* Modals */}
      <AuthModal
        isOpen={isAuthOpen || showAuthModal}
        onClose={() => {
          setIsAuthOpen(false);
          setShowAuthModal(false);
        }}
      />
      <UserProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        onSwitchUser={() => {
          setIsProfileOpen(false);
          setIsAuthOpen(true);
        }}
      />
      <LeaderboardModal
        isOpen={isLeaderboardOpen}
        onClose={() => setIsLeaderboardOpen(false)}
        defaultGame={activeGame}
      />
      <AnalyticsModal
        isOpen={isAnalyticsOpen}
        onClose={() => setIsAnalyticsOpen(false)}
        initialGameId={activeGame}
      />
    </>
  );
};
