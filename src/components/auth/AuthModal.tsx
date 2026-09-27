import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { X, Mail, Lock, User, LogIn, UserPlus, KeyRound, AlertCircle, CheckCircle } from 'lucide-react';
import { sound } from '../../utils/sound';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const { signIn, signUp, resetPassword } = useAuth();
  const [mode, setMode] = useState<'signin' | 'signup' | 'forgot'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setLoading(true);

    if (mode === 'signin') {
      const { error } = await signIn(email, password);
      setLoading(false);
      if (error) {
        sound.playWrong();
        setErrorMsg(error.message || '登入失敗，請檢查信箱或密碼');
      } else {
        sound.playCorrect();
        onClose();
      }
    } else if (mode === 'signup') {
      if (password.length < 6) {
        setLoading(false);
        setErrorMsg('密碼長度至少需要 6 個字元');
        return;
      }
      const { error } = await signUp(email, password, name);
      setLoading(false);
      if (error) {
        sound.playWrong();
        setErrorMsg(error.message || '註冊失敗，請稍後再試');
      } else {
        sound.playLevelUp();
        setSuccessMsg('註冊成功！若有啟用信箱驗證，請至信箱點擊確認信件。');
        setTimeout(() => {
          onClose();
        }, 1500);
      }
    } else if (mode === 'forgot') {
      const { error } = await resetPassword(email);
      setLoading(false);
      if (error) {
        setErrorMsg(error.message || '寄送密碼重設信件失敗');
      } else {
        setSuccessMsg('密碼重設信已寄出，請檢查您的電子信箱！');
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-850">
          <div className="flex items-center gap-2 font-bold text-lg text-white">
            {mode === 'signin' && <LogIn className="w-5 h-5 text-indigo-400" />}
            {mode === 'signup' && <UserPlus className="w-5 h-5 text-cyan-400" />}
            {mode === 'forgot' && <KeyRound className="w-5 h-5 text-amber-400" />}
            <span>
              {mode === 'signin' && '會員登入'}
              {mode === 'signup' && '註冊新帳號'}
              {mode === 'forgot' && '重設密碼'}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Switcher Tabs */}
        {mode !== 'forgot' && (
          <div className="flex border-b border-slate-800 bg-slate-950/50 p-1">
            <button
              onClick={() => {
                setMode('signin');
                setErrorMsg('');
                setSuccessMsg('');
              }}
              className={`flex-1 py-2 text-xs sm:text-sm font-semibold rounded-lg transition ${
                mode === 'signin'
                  ? 'bg-indigo-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              登入
            </button>
            <button
              onClick={() => {
                setMode('signup');
                setErrorMsg('');
                setSuccessMsg('');
              }}
              className={`flex-1 py-2 text-xs sm:text-sm font-semibold rounded-lg transition ${
                mode === 'signup'
                  ? 'bg-indigo-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              免費註冊
            </button>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle className="w-4 h-4 flex-shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {mode === 'signup' && (
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">玩家暱稱 (Display Name)</label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  placeholder="例如：大腦訓練大師"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-white text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">電子信箱 (Email)</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                placeholder="name@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-white text-sm focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {mode !== 'forgot' && (
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="text-xs font-semibold text-slate-300">密碼 (Password)</label>
                {mode === 'signin' && (
                  <button
                    type="button"
                    onClick={() => {
                      setMode('forgot');
                      setErrorMsg('');
                    }}
                    className="text-[11px] text-indigo-400 hover:text-indigo-300 hover:underline"
                  >
                    忘記密碼？
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  placeholder="至少 6 位字元"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-white text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-cyan-500 hover:from-indigo-600 hover:to-cyan-600 text-white font-bold text-sm shadow-lg shadow-indigo-500/25 transition active:scale-98 disabled:opacity-50"
          >
            {loading ? '處理中...' : mode === 'signin' ? '立即登入' : mode === 'signup' ? '註冊帳號' : '寄送重設信件'}
          </button>

          {mode === 'forgot' && (
            <button
              type="button"
              onClick={() => {
                setMode('signin');
                setErrorMsg('');
                setSuccessMsg('');
              }}
              className="w-full text-center text-xs text-slate-400 hover:text-slate-200 mt-2"
            >
              ← 返回登入頁面
            </button>
          )}
        </form>

        {/* Footer tip */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950/60 text-center text-[11px] text-slate-500">
          登入後即可享有「雲端同步歷史紀錄」與「全球腦力排行榜」功能！
        </div>
      </div>
    </div>
  );
};
