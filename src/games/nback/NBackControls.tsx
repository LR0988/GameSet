import React from 'react';
import { NBackMode, NBackResponse } from '../../types';
import { Play, Square, Brain, Volume2, MapPin } from 'lucide-react';

interface NBackControlsProps {
  isPlaying: boolean;
  mode: NBackMode;
  nLevel: number;
  currentTrialIdx: number;
  totalTrials: number;
  currentResponse: NBackResponse;
  feedback: {
    position?: 'correct' | 'wrong' | 'missed';
    audio?: 'correct' | 'wrong' | 'missed';
  };
  onStart: () => void;
  onStop: () => void;
  onPositionMatch: () => void;
  onAudioMatch: () => void;
}

export const NBackControls: React.FC<NBackControlsProps> = ({
  isPlaying,
  mode,
  nLevel,
  currentTrialIdx,
  totalTrials,
  currentResponse,
  feedback,
  onStart,
  onStop,
  onPositionMatch,
  onAudioMatch,
}) => {
  const showPositionBtn = mode === 'dual' || mode === 'position';
  const showAudioBtn = mode === 'dual' || mode === 'audio';

  const progressPercent = totalTrials > 0 && currentTrialIdx >= 0 
    ? Math.min(100, Math.round(((currentTrialIdx + 1) / totalTrials) * 100))
    : 0;

  return (
    <div className="w-full max-w-xl flex flex-col items-center gap-4 px-4">
      {/* Progress & Trial Counter */}
      {isPlaying && (
        <div className="w-full space-y-1.5">
          <div className="flex justify-between text-xs sm:text-sm font-medium text-slate-400">
            <span>回合進度 ({currentTrialIdx + 1} / {totalTrials})</span>
            <span className="text-indigo-400 font-semibold">{progressPercent}%</span>
          </div>
          <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden border border-slate-700/50">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 to-cyan-400 transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      )}

      {/* Primary Action Match Buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
        {showPositionBtn && (
          <button
            onClick={onPositionMatch}
            disabled={!isPlaying}
            className={`group relative flex items-center justify-between px-5 py-4 rounded-xl border font-bold text-base transition-all duration-150 select-none shadow-lg active:scale-95 ${
              !isPlaying
                ? 'opacity-50 cursor-not-allowed bg-slate-800/40 border-slate-700 text-slate-400'
                : currentResponse.positionPressed
                ? feedback.position === 'correct'
                  ? 'bg-emerald-600/30 border-emerald-500 text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.3)]'
                  : feedback.position === 'wrong'
                  ? 'bg-rose-600/30 border-rose-500 text-rose-300 shadow-[0_0_15px_rgba(244,63,94,0.3)]'
                  : 'bg-indigo-600/30 border-indigo-500 text-indigo-200'
                : 'bg-slate-800 hover:bg-slate-750 active:bg-slate-700 border-indigo-500/50 text-white hover:border-indigo-400'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-indigo-500/20 text-indigo-400">
                <MapPin className="w-5 h-5" />
              </div>
              <div className="text-left">
                <div className="leading-tight">位置相同</div>
                <div className="text-xs font-normal text-slate-400">與 {nLevel} 步前位置相同</div>
              </div>
            </div>
            <kbd className="px-2.5 py-1 bg-slate-900 border border-slate-700 rounded text-xs text-indigo-300 font-mono shadow-inner">
              按鍵 A
            </kbd>
          </button>
        )}

        {showAudioBtn && (
          <button
            onClick={onAudioMatch}
            disabled={!isPlaying}
            className={`group relative flex items-center justify-between px-5 py-4 rounded-xl border font-bold text-base transition-all duration-150 select-none shadow-lg active:scale-95 ${
              !isPlaying
                ? 'opacity-50 cursor-not-allowed bg-slate-800/40 border-slate-700 text-slate-400'
                : currentResponse.audioPressed
                ? feedback.audio === 'correct'
                  ? 'bg-emerald-600/30 border-emerald-500 text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.3)]'
                  : feedback.audio === 'wrong'
                  ? 'bg-rose-600/30 border-rose-500 text-rose-300 shadow-[0_0_15px_rgba(244,63,94,0.3)]'
                  : 'bg-cyan-600/30 border-cyan-500 text-cyan-200'
                : 'bg-slate-800 hover:bg-slate-750 active:bg-slate-700 border-cyan-500/50 text-white hover:border-cyan-400'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-cyan-500/20 text-cyan-400">
                <Volume2 className="w-5 h-5" />
              </div>
              <div className="text-left">
                <div className="leading-tight">聲音相同</div>
                <div className="text-xs font-normal text-slate-400">與 {nLevel} 步前字母相同</div>
              </div>
            </div>
            <kbd className="px-2.5 py-1 bg-slate-900 border border-slate-700 rounded text-xs text-cyan-300 font-mono shadow-inner">
              按鍵 L
            </kbd>
          </button>
        )}
      </div>

      {/* Start / Stop Bar */}
      <div className="flex items-center gap-3 w-full mt-1">
        {!isPlaying ? (
          <button
            onClick={onStart}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-gradient-to-r from-indigo-500 to-cyan-500 hover:from-indigo-600 hover:to-cyan-600 text-white font-bold text-base shadow-lg shadow-indigo-500/25 transition-all duration-150 active:scale-98"
          >
            <Play className="w-5 h-5 fill-current" />
            開始挑戰 ({nLevel}-Back)
          </button>
        ) : (
          <button
            onClick={onStop}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-rose-600/80 hover:bg-rose-700 border border-rose-500 text-white font-semibold text-base transition-all duration-150 active:scale-98"
          >
            <Square className="w-4 h-4 fill-current" />
            結束目前回合
          </button>
        )}
      </div>
    </div>
  );
};
