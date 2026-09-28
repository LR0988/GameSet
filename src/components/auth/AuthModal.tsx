import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { X, Mail, Lock, User, LogIn, UserPlus, KeyRound, Zap, Sparkles, Trash2, ArrowRight, CheckCircle2 } from 'lucide-react';
import { sound } from '../../utils/sound';
import { SavedUser } from '../../types';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const RANDOM_NICKNAMES = [
  '大腦挑戰者',
  '記憶大師',
  '直覺特工',
  '反應之神',
  '終極腦力王',
  '像素旅人',
  '神經元先鋒',
  '心智駭客',
];

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const { signIn, signUp, quickPlay, savedUsers, loginAsSavedUser, removeSavedUser, resetPassword } = useAuth();
  const [activeTab, setActiveTab] = useState<'profiles' | 'email_login' | 'email_signup' | 'forgot'>('profiles');
  const [quickNick, setQuickNick] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  if (!isOpen) return null;

  // Direct 1-click login for previous free users
  const handleDirectLogin = async (savedUser: SavedUser) => {
    sound.unlockAudio();
    sound.playLevelUp();
    setSuccessMsg(`歡迎回來，${savedUser.displayName}！`);
    await loginAsSavedUser(savedUser);
    setTimeout(() => {
      setSuccessMsg('');
      onClose();
    }, 600);
  };

  // Create new quick guest
  const handleQuickCreate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMsg('');
    setLoading(true);
    sound.unlockAudio();

    const nick = quickNick.trim() || RANDOM_NICKNAMES[Math.floor(Math.random() * RANDOM_NICKNAMES.length)];
    const res = await quickPlay(nick);
    setLoading(false);

    if (res.error) {
      sound.playWrong();
      setErrorMsg('建立身份失敗，請重試');
    } else {
      sound.playLevelUp();
      setSuccessMsg(`玩家「${nick}」已就緒！`);
      setTimeout(() => {
        setSuccessMsg('');
        onClose();
      }, 700);
    }
  };

  // Email form submit
  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setLoading(true);
    sound.unlockAudio();

    if (activeTab === 'email_login') {
      const { error } = await signIn(email, password);
      setLoading(false);
      if (error) {
        sound.playWrong();
        setErrorMsg(error.message || '登入失敗，請確認帳號密碼');
      } else {
        sound.playLevelUp();
        setSuccessMsg('登入成功！');
        setTimeout(() => onClose(), 600);
      }
    } else if (activeTab === 'email_signup') {
      if (password.length < 6) {
        setLoading(false);
        setErrorMsg('密碼長度至少需要 6 個字元');
        return;
      }
      const { error } = await signUp(email, password, name);
      setLoading(false);
      if (error) {
        sound.playWrong();
        setErrorMsg(error.message || '註冊失敗，請確認資料');
      } else {
        sound.playLevelUp();
        setSuccessMsg('註冊成功！已自動登入');
        setTimeout(() => onClose(), 700);
      }
    } else if (activeTab === 'forgot') {
      const { error } = await resetPassword(email);
      setLoading(false);
      if (error) {
        setErrorMsg(error.message || '寄送密碼重設信件失敗');
      } else {
        setSuccessMsg('密碼重設信已寄出，請檢查信箱！');
      }
    }
  };

  const handleRollNickname = () => {
    sound.playClick();
    const pick = RANDOM_NICKNAMES[Math.floor(Math.random() * RANDOM_NICKNAMES.length)];
    setQuickNick(pick);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Top Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/80">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-500 to-cyan-400 flex items-center justify-center text-white font-black text-sm shadow-md shadow-indigo-500/30">
              GS
            </div>
            <div>
              <h3 className="font-extrabold text-base sm:text-lg text-white">歡迎來到 Game Set 腦力遊戲集</h3>
              <p className="text-xs text-slate-400">請選取現有使用者或快速建立身份</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
            title="關閉"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Success / Error notification */}
        {successMsg && (
          <div className="m-4 mb-0 p-3 rounded-xl bg-emerald-950/70 border border-emerald-500/50 text-emerald-300 text-xs sm:text-sm flex items-center gap-2 animate-fadeIn">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}
        {errorMsg && (
          <div className="m-4 mb-0 p-3 rounded-xl bg-rose-950/70 border border-rose-500/50 text-rose-300 text-xs sm:text-sm flex items-center gap-2 animate-fadeIn">
            <X className="w-4 h-4 text-rose-400 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <div className="p-6 overflow-y-auto space-y-6">
          {/* Section 1: Previous Free Users (History Accounts) */}
          {savedUsers.length > 0 && activeTab === 'profiles' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-bold text-white">
                  <User className="w-4 h-4 text-indigo-400" />
                  <span>歷史免費玩家帳號（點擊直接登入）</span>
                </div>
                <span className="text-[11px] text-slate-400">共 {savedUsers.length} 位</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-56 overflow-y-auto pr-1">
                {savedUsers.map(u => (
                  <div
                    key={u.id}
                    onClick={() => handleDirectLogin(u)}
                    className="group relative flex items-center justify-between p-3 rounded-2xl bg-slate-800/60 hover:bg-indigo-950/60 border border-slate-700/60 hover:border-indigo-500/80 transition-all duration-200 cursor-pointer shadow-sm hover:shadow-indigo-500/10 active:scale-98"
                  >
                    <div className="flex items-center gap-2.5 overflow-hidden">
                      <div className={`w-10 h-10 rounded-xl bg-gradient-to-tr ${u.avatarColor || 'from-indigo-500 to-purple-600'} text-white font-extrabold text-sm flex items-center justify-center flex-shrink-0 shadow-md`}>
                        {u.displayName[0]?.toUpperCase() || 'U'}
                      </div>
                      <div className="overflow-hidden">
                        <div className="font-bold text-sm text-white group-hover:text-indigo-200 truncate flex items-center gap-1.5">
                          <span>{u.displayName}</span>
                          {u.isGuest && (
                            <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-slate-700 text-slate-300 font-normal">
                              訪客
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          {new Date(u.lastLoginAt).toLocaleDateString('zh-TW', { month: 'numeric', day: 'numeric' })} 上線
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button
                        onClick={e => {
                          e.stopPropagation();
                          removeSavedUser(u.id);
                        }}
                        className="opacity-0 group-hover:opacity-100 p-1.5 text-slate-500 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition"
                        title="移除此帳號記錄"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                      <div className="p-1 rounded-lg bg-indigo-500/10 text-indigo-400 group-hover:bg-indigo-500 group-hover:text-white transition">
                        <ArrowRight className="w-4 h-4" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Section 2: Create New Free User (Quick Play) */}
          {activeTab === 'profiles' && (
            <div className="p-4 rounded-2xl bg-gradient-to-b from-slate-850 to-slate-900 border border-indigo-500/30 space-y-3">
              <div className="flex items-center gap-2 text-sm font-bold text-white">
                <Zap className="w-4 h-4 text-amber-400" />
                <span>建立新的免費玩家（免信箱，1秒開玩）</span>
              </div>

              <form onSubmit={handleQuickCreate} className="space-y-3">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={quickNick}
                    onChange={e => setQuickNick(e.target.value)}
                    placeholder="輸入暱稱，例如：大腦大師"
                    maxLength={15}
                    className="flex-1 px-4 py-2.5 rounded-xl bg-slate-950/80 border border-slate-700 focus:border-indigo-400 text-white placeholder-slate-500 text-sm outline-none transition"
                  />
                  <button
                    type="button"
                    onClick={handleRollNickname}
                    className="px-3 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-750 border border-slate-700 text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-1 transition"
                    title="隨機生成酷炫暱稱"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>隨機</span>
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-cyan-500 hover:from-indigo-600 hover:to-cyan-600 text-white font-bold text-sm shadow-lg shadow-indigo-500/25 transition active:scale-98 disabled:opacity-50"
                >
                  <Zap className="w-4 h-4 fill-current text-amber-300" />
                  <span>{loading ? '建立中...' : '立即開始免費遊玩'}</span>
                </button>
              </form>
            </div>
          )}

          {/* Section 3: Email Login / Register Alternative */}
          <div className="pt-2 border-t border-slate-800/80">
            {activeTab === 'profiles' ? (
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>已有電子信箱會員帳號？</span>
                <button
                  onClick={() => setActiveTab('email_login')}
                  className="font-semibold text-indigo-400 hover:text-indigo-300 underline underline-offset-4 transition"
                >
                  切換至信箱登入 / 註冊
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex gap-2">
                    <button
                      onClick={() => setActiveTab('email_login')}
                      className={`text-xs font-bold px-3 py-1.5 rounded-lg transition ${
                        activeTab === 'email_login'
                          ? 'bg-indigo-600 text-white'
                          : 'text-slate-400 hover:text-white bg-slate-800'
                      }`}
                    >
                      會員登入
                    </button>
                    <button
                      onClick={() => setActiveTab('email_signup')}
                      className={`text-xs font-bold px-3 py-1.5 rounded-lg transition ${
                        activeTab === 'email_signup'
                          ? 'bg-indigo-600 text-white'
                          : 'text-slate-400 hover:text-white bg-slate-800'
                      }`}
                    >
                      註冊新帳號
                    </button>
                  </div>

                  <button
                    onClick={() => setActiveTab('profiles')}
                    className="text-xs text-indigo-400 hover:text-indigo-300 underline"
                  >
                    ← 返回免費玩家清單
                  </button>
                </div>

                <form onSubmit={handleEmailSubmit} className="space-y-3">
                  {activeTab === 'email_signup' && (
                    <div className="space-y-1">
                      <label className="text-xs text-slate-300">暱稱</label>
                      <div className="relative">
                        <User className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                        <input
                          type="text"
                          required
                          value={name}
                          onChange={e => setName(e.target.value)}
                          placeholder="例如：大腦天才"
                          className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-950/80 border border-slate-700 text-sm text-white focus:border-indigo-400 outline-none"
                        />
                      </div>
                    </div>
                  )}

                  <div className="space-y-1">
                    <label className="text-xs text-slate-300">電子信箱</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        placeholder="your@email.com"
                        className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-950/80 border border-slate-700 text-sm text-white focus:border-indigo-400 outline-none"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs text-slate-300">密碼</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                      <input
                        type="password"
                        required
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        placeholder="至少 6 位字元"
                        className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-950/80 border border-slate-700 text-sm text-white focus:border-indigo-400 outline-none"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm transition"
                  >
                    {loading ? '處理中...' : activeTab === 'email_login' ? '登入會員' : '完成註冊'}
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer: Quick Skip option */}
        <div className="p-3.5 border-t border-slate-800 bg-slate-950 flex items-center justify-between text-xs text-slate-400 px-6">
          <span>不想登入？也可以先玩！</span>
          <button
            onClick={onClose}
            className="text-indigo-400 hover:text-white font-semibold underline underline-offset-2 transition"
          >
            以訪客身份直接體驗 →
          </button>
        </div>
      </div>
    </div>
  );
};
