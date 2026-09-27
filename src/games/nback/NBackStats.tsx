import React from 'react';
import { NBackSessionStats } from '../../types';
import { Award, CheckCircle2, XCircle, AlertCircle, ArrowUpCircle, ArrowDownCircle, RotateCcw } from 'lucide-react';

interface NBackStatsProps {
  stats: NBackSessionStats;
  onPlayAgain: () => void;
}

export const NBackStats: React.FC<NBackStatsProps> = ({ stats, onPlayAgain }) => {
  const isHighScore = stats.overallAccuracy >= 80;
  const isFail = stats.overallAccuracy < 50;

  return (
    <div className="w-full max-w-lg p-6 bg-slate-900/90 border border-slate-700/80 rounded-2xl shadow-2xl backdrop-blur-xl flex flex-col items-center gap-6 animate-bounce-subtle">
      {/* Title & Badge */}
      <div className="flex flex-col items-center text-center gap-2">
        <div className={`p-3.5 rounded-full ${
          isHighScore 
            ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' 
            : isFail 
            ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' 
            : 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30'
        }`}>
          <Award className="w-8 h-8" />
        </div>
        <h3 className="text-2xl font-black tracking-wide text-white">回合測驗結算</h3>
        <p className="text-sm text-slate-400">
          模式：{stats.mode === 'dual' ? '雙重 (Dual)' : stats.mode === 'position' ? '空間位置 (Position)' : '語音字母 (Audio)'} · 難度：
          <span className="font-bold text-indigo-400 ml-1">{stats.nLevel}-Back</span>
        </p>
      </div>

      {/* Main Score & Accuracy Banner */}
      <div className="w-full grid grid-cols-2 gap-3">
        <div className="flex flex-col items-center justify-center p-4 rounded-xl bg-slate-800/80 border border-slate-700/60">
          <span className="text-xs uppercase text-slate-400 font-medium">綜合正確率</span>
          <span className={`text-4xl font-black mt-1 ${
            stats.overallAccuracy >= 80 ? 'text-emerald-400' : stats.overallAccuracy >= 60 ? 'text-cyan-400' : 'text-rose-400'
          }`}>
            {stats.overallAccuracy}%
          </span>
        </div>
        <div className="flex flex-col items-center justify-center p-4 rounded-xl bg-slate-800/80 border border-slate-700/60">
          <span className="text-xs uppercase text-slate-400 font-medium">獲得積分</span>
          <span className="text-4xl font-black text-amber-400 mt-1">
            {stats.score}
          </span>
        </div>
      </div>

      {/* Adaptive Level Change Notice */}
      {isHighScore ? (
        <div className="w-full flex items-center gap-3 p-3 rounded-xl bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 text-sm">
          <ArrowUpCircle className="w-5 h-5 flex-shrink-0" />
          <span>表現優異！正確率達標 (≥80%)，自動提升至 <strong>{stats.nLevel + 1}-Back</strong>！</span>
        </div>
      ) : isFail && stats.nLevel > 1 ? (
        <div className="w-full flex items-center gap-3 p-3 rounded-xl bg-rose-950/60 border border-rose-500/30 text-rose-300 text-sm">
          <ArrowDownCircle className="w-5 h-5 flex-shrink-0" />
          <span>正確率低於 50%，難度降至 <strong>{stats.nLevel - 1}-Back</strong> 穩固記憶基礎！</span>
        </div>
      ) : (
        <div className="w-full flex items-center gap-3 p-3 rounded-xl bg-indigo-950/60 border border-indigo-500/30 text-indigo-300 text-sm">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          <span>表現穩定，保持在 <strong>{stats.nLevel}-Back</strong> 進行大腦神經塑性鍛鍊！</span>
        </div>
      )}

      {/* Detailed breakdown table */}
      <div className="w-full space-y-3">
        {(stats.mode === 'dual' || stats.mode === 'position') && (
          <div className="p-3.5 rounded-xl bg-slate-800/50 border border-slate-700/40 text-xs sm:text-sm">
            <div className="flex justify-between font-semibold text-slate-200 mb-2">
              <span>📍 位置記憶指標</span>
              <span className="text-indigo-400 font-bold">{stats.positionAccuracy}%</span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-slate-300">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>命中：{stats.positionHits}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-amber-400" />
                <span>漏答：{stats.positionMisses}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <XCircle className="w-4 h-4 text-rose-400" />
                <span>誤報：{stats.positionFalseAlarms}</span>
              </div>
            </div>
          </div>
        )}

        {(stats.mode === 'dual' || stats.mode === 'audio') && (
          <div className="p-3.5 rounded-xl bg-slate-800/50 border border-slate-700/40 text-xs sm:text-sm">
            <div className="flex justify-between font-semibold text-slate-200 mb-2">
              <span>🔊 聽覺字母記憶指標</span>
              <span className="text-cyan-400 font-bold">{stats.audioAccuracy}%</span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-slate-300">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>命中：{stats.audioHits}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-amber-400" />
                <span>漏答：{stats.audioMisses}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <XCircle className="w-4 h-4 text-rose-400" />
                <span>誤報：{stats.audioFalseAlarms}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Action button */}
      <button
        onClick={onPlayAgain}
        className="w-full flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-gradient-to-r from-indigo-500 to-cyan-500 hover:from-indigo-600 hover:to-cyan-600 text-white font-bold text-base shadow-lg shadow-indigo-500/30 transition-all active:scale-98"
      >
        <RotateCcw className="w-5 h-5" />
        進行下一回合
      </button>
    </div>
  );
};
