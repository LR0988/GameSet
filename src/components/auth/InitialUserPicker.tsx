import React, { useState } from 'react';
import { SavedUser } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { User, UserPlus, Check, X, Sparkles, Brain, LogIn } from 'lucide-react';

interface InitialUserPickerProps {
  onEnter: (user: SavedUser) => void;
}

export const InitialUserPicker: React.FC<InitialUserPickerProps> = ({ onEnter }) => {
  const { savedUsers, quickPlay, setShowAuthModal } = useAuth();
  const [isAdding, setIsAdding] = useState(false);
  const [nickname, setNickname] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSelect = (u: SavedUser) => {
    onEnter(u);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nickname.trim() || loading) return;

    setLoading(true);
    const res = await quickPlay(nickname.trim());
    setLoading(false);
    if (res.user) {
      onEnter(res.user);
    }
  };

  return (
    <div className="w-full max-w-xl mx-auto my-auto p-6 sm:p-8 rounded-3xl bg-slate-900/95 border border-slate-800 shadow-2xl backdrop-blur-xl text-center animate-fadeIn">
      {/* Brand Icon */}
      <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-cyan-400 flex items-center justify-center font-black text-2xl text-white shadow-xl shadow-indigo-500/25">
        GS
      </div>

      <h2 className="text-2xl sm:text-3xl font-black text-white tracking-wide flex items-center justify-center gap-2 mb-2">
        <span>Game Set</span>
        <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
          腦力遊戲集
        </span>
      </h2>

      <p className="text-sm text-slate-400 max-w-md mx-auto mb-6">
        歡迎！請點選您的遊玩名稱即可一鍵開始，隨時記錄腦力表現與歷史分數：
      </p>

      {/* Inline Create Input */}
      {isAdding ? (
        <form
          onSubmit={handleCreate}
          className="flex items-center gap-2 p-2.5 mb-5 rounded-2xl bg-indigo-950/60 border border-indigo-500/50 shadow-inner"
        >
          <span className="text-xs text-indigo-200 font-medium pl-1">新玩家暱稱：</span>
          <input
            type="text"
            autoFocus
            value={nickname}
            onChange={e => setNickname(e.target.value)}
            placeholder="例如: 小明、記憶大師..."
            maxLength={15}
            className="flex-1 px-3 py-2 text-xs rounded-xl bg-slate-900 border border-indigo-400 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
          <button
            type="submit"
            disabled={!nickname.trim() || loading}
            className="flex items-center gap-1 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-bold transition active:scale-95 shadow-md"
          >
            <Check className="w-3.5 h-3.5" />
            <span>開始</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setIsAdding(false);
              setNickname('');
            }}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </form>
      ) : (
        <div className="flex justify-end mb-3">
          <button
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/40 border border-indigo-500/40 text-indigo-300 hover:text-white text-xs font-semibold transition active:scale-95"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>➕ 新增其他名稱</span>
          </button>
        </div>
      )}

      {/* 1-Click Saved User Buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
        {savedUsers.map(u => (
          <button
            key={u.id}
            onClick={() => handleSelect(u)}
            className="group flex items-center justify-between p-3.5 rounded-2xl bg-slate-800/80 hover:bg-gradient-to-r hover:from-indigo-600 hover:to-cyan-600 border border-slate-750 hover:border-cyan-400 text-left transition-all duration-200 active:scale-98 shadow-md"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-slate-700 group-hover:bg-black/30 flex items-center justify-center font-black text-sm text-white transition-colors">
                {u.displayName.charAt(0).toUpperCase()}
              </div>
              <div>
                <div className="text-sm font-bold text-white leading-tight">
                  {u.displayName}
                </div>
                <div className="text-[11px] text-slate-400 group-hover:text-cyan-100">
                  {u.isGuest ? '免登入玩家' : '會員玩家'}
                </div>
              </div>
            </div>

            <span className="text-xs px-2.5 py-1 rounded-xl bg-slate-700/60 group-hover:bg-white/20 text-slate-300 group-hover:text-white font-semibold transition">
              一鍵開始 →
            </span>
          </button>
        ))}
      </div>

      {/* Cloud Account Option */}
      <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
        <span className="flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
          隨時可在右上角切換使用者
        </span>

        <button
          onClick={() => setShowAuthModal(true)}
          className="flex items-center gap-1 text-indigo-400 hover:text-indigo-300 underline font-medium transition"
        >
          <LogIn className="w-3.5 h-3.5" />
          <span>雲端帳號登入 / 註冊</span>
        </button>
      </div>
    </div>
  );
};
