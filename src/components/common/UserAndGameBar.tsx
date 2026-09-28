import React, { useState } from 'react';
import { GameId, SavedUser } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { Brain, Zap, Grid3X3, Gamepad2, User, UserPlus, Check, X, LogIn } from 'lucide-react';

interface UserAndGameBarProps {
  activeGame: GameId;
  onSelectGame: (game: GameId) => void;
}

export const UserAndGameBar: React.FC<UserAndGameBarProps> = ({
  activeGame,
  onSelectGame,
}) => {
  const {
    user,
    displayName,
    savedUsers,
    loginAsSavedUser,
    quickPlay,
    setShowAuthModal,
  } = useAuth();

  const [isAddingUser, setIsAddingUser] = useState(false);
  const [newNick, setNewNick] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const games: { id: GameId; label: string; icon: React.ReactNode; color: string; badge?: string }[] = [
    {
      id: 'nback',
      label: 'N-Back 記憶訓練',
      icon: <Brain className="w-4 h-4" />,
      color: 'from-indigo-600 to-cyan-600',
      badge: '大腦核心',
    },
    {
      id: 'stroop',
      label: '斯特魯普測驗',
      icon: <Zap className="w-4 h-4" />,
      color: 'from-amber-500 to-rose-500',
      badge: '反應抗干擾',
    },
    {
      id: 'game2048',
      label: '2048 拼圖',
      icon: <Grid3X3 className="w-4 h-4" />,
      color: 'from-emerald-500 to-teal-600',
      badge: '邏輯策略',
    },
    {
      id: 'snake',
      label: '經典貪食蛇',
      icon: <Gamepad2 className="w-4 h-4" />,
      color: 'from-green-500 to-emerald-600',
      badge: '反射敏捷',
    },
  ];

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNick.trim() || isSubmitting) return;

    setIsSubmitting(true);
    await quickPlay(newNick.trim());
    setNewNick('');
    setIsAddingUser(false);
    setIsSubmitting(false);
  };

  const handleSelectUser = (u: SavedUser) => {
    loginAsSavedUser(u);
  };

  return (
    <div className="w-full max-w-4xl mx-auto mb-4 space-y-3 px-2">
      {/* 1. Direct User Selector Strip (No modal card popup, 1-click switch!) */}
      <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl backdrop-blur-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 mb-2.5">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-400">
              <User className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs sm:text-sm font-bold text-white tracking-wide">
                一鍵切換使用者：
              </span>
              <span className="text-[11px] text-slate-400 ml-1.5 hidden sm:inline">
                點選下方任意名稱即可直接以該玩家身分遊玩
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            {!isAddingUser && (
              <button
                onClick={() => setIsAddingUser(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/40 border border-indigo-500/40 text-indigo-300 hover:text-white text-xs font-semibold transition active:scale-95 shadow-sm"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>新增玩家</span>
              </button>
            )}

            <button
              onClick={() => setShowAuthModal(true)}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-750 border border-slate-700 text-slate-400 hover:text-slate-200 text-xs font-medium transition"
              title="使用 Email 或註冊完整帳號以雲端同步"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">雲端登入</span>
            </button>
          </div>
        </div>

        {/* Inline Add User Input */}
        {isAddingUser && (
          <form
            onSubmit={handleCreateUser}
            className="flex items-center gap-2 p-2.5 mb-3 rounded-xl bg-indigo-950/40 border border-indigo-500/50 animate-fadeIn"
          >
            <span className="text-xs text-indigo-200 font-medium pl-1">輸入暱稱：</span>
            <input
              type="text"
              autoFocus
              value={newNick}
              onChange={e => setNewNick(e.target.value)}
              placeholder="例如: 小明、大腦冠軍..."
              maxLength={15}
              className="flex-1 px-3 py-1.5 text-xs rounded-lg bg-slate-900 border border-indigo-400/50 text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-400"
            />
            <button
              type="submit"
              disabled={!newNick.trim() || isSubmitting}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-bold transition active:scale-95 shadow-sm"
            >
              <Check className="w-3.5 h-3.5" />
              <span>建立並切換</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setIsAddingUser(false);
                setNewNick('');
              }}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              title="取消"
            >
              <X className="w-4 h-4" />
            </button>
          </form>
        )}

        {/* User Buttons List (One-click direct switch buttons) */}
        <div className="flex flex-wrap items-center gap-2">
          {savedUsers.map(u => {
            const isActive = (user && user.id === u.id) || displayName === u.displayName;

            return (
              <button
                key={u.id}
                onClick={() => handleSelectUser(u)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all active:scale-95 shadow-sm ${
                  isActive
                    ? 'bg-gradient-to-r from-indigo-600 to-cyan-600 text-white border border-cyan-400/80 shadow-md shadow-indigo-500/25 ring-2 ring-indigo-400/40'
                    : 'bg-slate-800/90 hover:bg-slate-750 text-slate-300 hover:text-white border border-slate-750 hover:border-slate-600'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black text-white ${
                    isActive ? 'bg-black/30' : 'bg-slate-700'
                  }`}
                >
                  {u.displayName.charAt(0).toUpperCase()}
                </div>
                <span>{u.displayName}</span>
                {isActive && (
                  <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/30 text-cyan-200 border border-cyan-300/30">
                    使用中
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Direct Game Selector Buttons (Direct action buttons, not cards!) */}
      <div className="p-2 sm:p-2.5 rounded-2xl bg-slate-900/80 border border-slate-800 backdrop-blur-md">
        <div className="flex items-center gap-2 px-2 pb-2">
          <span className="text-[11px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider">
            選擇遊玩項目：
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {games.map(g => {
            const isSelected = activeGame === g.id;

            return (
              <button
                key={g.id}
                onClick={() => onSelectGame(g.id)}
                className={`flex items-center justify-center sm:justify-start gap-2.5 px-3 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all active:scale-98 ${
                  isSelected
                    ? `bg-gradient-to-r ${g.color} text-white shadow-lg shadow-indigo-600/20 border border-white/20 ring-1 ring-white/30`
                    : 'bg-slate-800/80 hover:bg-slate-750 text-slate-300 hover:text-white border border-slate-750 hover:border-slate-700'
                }`}
              >
                <div className={`p-1 rounded-lg ${isSelected ? 'bg-white/20' : 'bg-slate-700/60'}`}>
                  {g.icon}
                </div>
                <div className="flex flex-col text-left">
                  <span className="leading-tight">{g.label}</span>
                  {g.badge && (
                    <span
                      className={`text-[9px] font-medium leading-none mt-0.5 ${
                        isSelected ? 'text-white/80' : 'text-slate-400'
                      }`}
                    >
                      {g.badge}
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
