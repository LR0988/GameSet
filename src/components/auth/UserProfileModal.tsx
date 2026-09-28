import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { storage } from '../../utils/storage';
import {
  X,
  User,
  Users,
  UserPlus,
  Mail,
  LogOut,
  Check,
  Trophy,
  Sparkles,
  Brain,
  Zap,
  Gamepad2,
  Grid3X3,
  Edit3,
} from 'lucide-react';
import { sound } from '../../utils/sound';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSwitchUser?: () => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  isOpen,
  onClose,
  onSwitchUser,
}) => {
  const {
    user,
    displayName,
    savedUsers,
    loginAsSavedUser,
    quickPlay,
    updateDisplayName,
    signOut,
  } = useAuth();

  const [editingName, setEditingName] = useState(false);
  const [newName, setNewName] = useState(displayName);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Adding new user in switcher
  const [isAddingUser, setIsAddingUser] = useState(false);
  const [newNick, setNewNick] = useState('');
  const [isCreatingUser, setIsCreatingUser] = useState(false);

  if (!isOpen || !user) return null;

  const handleSaveName = async () => {
    if (!newName.trim()) return;
    setSaving(true);
    const { error } = await updateDisplayName(newName.trim());
    setSaving(false);
    if (!error) {
      sound.playCorrect();
      setEditingName(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    }
  };

  const handleCreateNewUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNick.trim() || isCreatingUser) return;
    setIsCreatingUser(true);
    await quickPlay(newNick.trim());
    setIsCreatingUser(false);
    setNewNick('');
    setIsAddingUser(false);
    sound.playClick();
  };

  const handleSignOut = async () => {
    sound.playClick();
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('gameset_user_entered');
    }
    await signOut();
    onClose();
  };

  // Current user's personal best records
  const nbackScore = storage.getUserHighScore('nback', user.id);
  const stroopScore = storage.getUserHighScore('stroop', user.id);
  const game2048Score = storage.getUserHighScore('game2048', user.id);
  const snakeScore = storage.getUserHighScore('snake', user.id);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-850">
          <div className="flex items-center gap-2 font-bold text-lg text-white">
            <Users className="w-5 h-5 text-indigo-400" />
            <span>切換使用者與玩家中心</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5 overflow-y-auto max-h-[75vh]">
          {/* 1. Quick 1-Click User Switcher (點擊任意名字立即切換) */}
          <div className="p-4 rounded-xl bg-slate-800/90 border border-indigo-500/40 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-cyan-400" />
                <span className="text-xs sm:text-sm font-bold text-white">
                  切換使用者 (點擊即時切換)：
                </span>
              </div>
              {!isAddingUser && (
                <button
                  onClick={() => setIsAddingUser(true)}
                  className="flex items-center gap-1 text-xs text-indigo-300 hover:text-white px-2 py-1 rounded bg-indigo-600/30 hover:bg-indigo-600/50 border border-indigo-500/40 font-medium transition"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>新增玩家</span>
                </button>
              )}
            </div>

            {/* Inline Add New User Input */}
            {isAddingUser && (
              <form onSubmit={handleCreateNewUser} className="flex items-center gap-2 pt-1 animate-fadeIn">
                <input
                  type="text"
                  autoFocus
                  value={newNick}
                  onChange={e => setNewNick(e.target.value)}
                  placeholder="輸入新暱稱..."
                  maxLength={15}
                  className="flex-1 px-2.5 py-1 text-xs rounded-lg bg-slate-900 border border-indigo-400 text-white placeholder-slate-500 focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={!newNick.trim() || isCreatingUser}
                  className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition"
                >
                  建立
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsAddingUser(false);
                    setNewNick('');
                  }}
                  className="p-1 text-slate-400 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </form>
            )}

            {/* All Saved User Buttons */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {savedUsers.map(u => {
                const isActive = u.id === user.id || u.displayName === displayName;

                return (
                  <button
                    key={u.id}
                    onClick={() => {
                      loginAsSavedUser(u);
                      sound.playClick();
                    }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition active:scale-95 shadow-sm ${
                      isActive
                        ? 'bg-gradient-to-r from-indigo-600 to-cyan-600 text-white border border-cyan-400 shadow-md ring-1 ring-cyan-400/40'
                        : 'bg-slate-750 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700'
                    }`}
                  >
                    <div className="w-4 h-4 rounded-full bg-black/30 flex items-center justify-center text-[9px] font-black text-white">
                      {u.displayName.charAt(0).toUpperCase()}
                    </div>
                    <span>{u.displayName}</span>
                    {isActive && (
                      <span className="text-[10px] px-1 py-0.2 rounded bg-black/30 text-cyan-200">
                        使用中
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Current User Profile Info Card */}
          <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-indigo-500 to-cyan-400 flex items-center justify-center font-black text-xl text-white shadow-md">
                  {(displayName || user.email || 'U')[0].toUpperCase()}
                </div>
                <div>
                  {!editingName ? (
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-base">
                        {displayName || '未設定暱稱'}
                      </span>
                      <button
                        onClick={() => {
                          setNewName(displayName);
                          setEditingName(true);
                        }}
                        className="text-slate-400 hover:text-indigo-400"
                        title="編輯暱稱"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 mt-1">
                      <input
                        type="text"
                        value={newName}
                        onChange={e => setNewName(e.target.value)}
                        className="px-2 py-1 rounded bg-slate-900 border border-indigo-500 text-white text-xs w-32 focus:outline-none"
                      />
                      <button
                        onClick={handleSaveName}
                        disabled={saving}
                        className="p-1 rounded bg-indigo-600 hover:bg-indigo-500 text-white text-xs"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setEditingName(false)}
                        className="p-1 rounded bg-slate-700 text-slate-300 text-xs"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                  <div className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                    <Mail className="w-3.5 h-3.5" />
                    <span>{user.email}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
                <Sparkles className="w-3 h-3" />
                <span>已連線</span>
              </div>
            </div>

            {saveSuccess && (
              <div className="text-[11px] text-emerald-400 font-medium">暱稱已成功更新！</div>
            )}
          </div>

          {/* 3. Personal Game Records Summary */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              個人最佳成績記錄
            </h4>
            <div className="grid grid-cols-2 gap-2.5">
              <div className="p-3 rounded-xl bg-slate-800/50 border border-slate-700/60 flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-indigo-500/20 text-indigo-400">
                  <Brain className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-[10px] text-slate-400">N-Back 記憶</div>
                  <div className="text-sm font-black text-white">{nbackScore} 分</div>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-800/50 border border-slate-700/60 flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-amber-500/20 text-amber-400">
                  <Zap className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-[10px] text-slate-400">斯特魯普測驗</div>
                  <div className="text-sm font-black text-white">{stroopScore} 分</div>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-800/50 border border-slate-700/60 flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-yellow-500/20 text-yellow-400">
                  <Grid3X3 className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-[10px] text-slate-400">2048 最佳</div>
                  <div className="text-sm font-black text-white">{game2048Score} 分</div>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-800/50 border border-slate-700/60 flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400">
                  <Gamepad2 className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-[10px] text-slate-400">貪食蛇得分</div>
                  <div className="text-sm font-black text-white">{snakeScore} 分</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-850 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <button
              onClick={handleSignOut}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 border border-rose-500/30 text-rose-300 text-xs font-semibold transition"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>切換 / 登出玩家</span>
            </button>

            {onSwitchUser && (
              <button
                onClick={onSwitchUser}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 border border-slate-700 text-indigo-300 text-xs font-semibold transition"
              >
                <User className="w-3.5 h-3.5" />
                <span>帳號登入</span>
              </button>
            )}
          </div>

          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition"
          >
            確定完成
          </button>
        </div>
      </div>
    </div>
  );
};
