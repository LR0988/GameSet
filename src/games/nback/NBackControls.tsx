import React from 'react';
import { NBackMode, NBackResponse } from '../../types';
import { Play, Square, Volume2, MapPin, Check, X } from 'lucide-react';
import { sound } from '../../utils/sound';

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

  const handleStart = () => {
    sound.unlockAudio();
    onStart();
  };

  const handlePosMatch = () => {
    sound.unlockAudio();
    onPositionMatch();
  };

  const handleAudMatch = () => {
    sound.unlockAudio();
    onAudioMatch();
  };

  const progressPercent = totalTrials > 0 && currentTrialIdx >= 0 
    ? Math.min(100, Math.round(((currentTrialIdx + 1) / totalTrials) * 100))
    : 0;

  return (
    <div className="flex flex-col items-center w-72 sm:w-80 md:w-96 gap-3.5 select-none">
      {/* 2 Split Action Match Buttons directly beneath the 3x3 grid */}
      <div className="grid grid-cols-2 gap-3 w-full">
        {/* Left Button: Position Match (Key A) */}
        <button
          onClick={handlePosMatch}
          disabled={!isPlaying || !showPositionBtn}
          className={`relative flex flex-col items-center justify-center p-3.5 sm:p-4 rounded-2xl border-2 font-bold transition-all duration-150 active:scale-95 shadow-lg ${
            !isPlaying || !showPositionBtn
              ? 'opacity-40 cursor-not-allowed bg-slate-800/40 border-slate-700 text-slate-400'
              : currentResponse.positionPressed
              ? feedback.position === 'correct'
                ? 'bg-emerald-600/40 border-emerald-400 text-emerald-200 shadow-[0_0_20px_rgba(16,185,129,0.5)] scale-98'
                : feedback.position === 'wrong'
                ? 'bg-rose-600/40 border-rose-400 text-rose-200 shadow-[0_0_20px_rgba(244,63,94,0.5)] scale-98'
                : 'bg-indigo-600/40 border-indigo-400 text-indigo-100'
              : 'bg-gradient-to-b from-indigo-900/60 to-slate-900 border-indigo-500/70 hover:border-indigo-400 text-white shadow-indigo-950/50 hover:shadow-indigo-500/20'
          }`}
        >
          <div className="flex items-center gap-1.5 mb-1">
            <div className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-400">
              <MapPin className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            {currentResponse.positionPressed && feedback.position === 'correct' && (
              <Check className="w-4 h-4 text-emerald-400 animate-bounce" />
            )}
            {currentResponse.positionPressed && feedback.position === 'wrong' && (
              <X className="w-4 h-4 text-rose-400 animate-bounce" />
            )}
          </div>

          <div className="text-sm sm:text-base font-black tracking-wide leading-tight">
            位置相同
          </div>
          <div className="text-[10px] sm:text-xs text-slate-400 mt-0.5">
            {nLevel} 步前位置
          </div>

          <kbd className="mt-2 px-2 py-0.5 rounded-md bg-slate-950/80 border border-indigo-500/30 text-[10px] sm:text-xs text-indigo-300 font-mono shadow-inner">
            按鍵 A
          </kbd>
        </button>

        {/* Right Button: Audio / Letter Match (Key L) */}
        <button
          onClick={handleAudMatch}
          disabled={!isPlaying || !showAudioBtn}
          className={`relative flex flex-col items-center justify-center p-3.5 sm:p-4 rounded-2xl border-2 font-bold transition-all duration-150 active:scale-95 shadow-lg ${
            !isPlaying || !showAudioBtn
              ? 'opacity-40 cursor-not-allowed bg-slate-800/40 border-slate-700 text-slate-400'
              : currentResponse.audioPressed
              ? feedback.audio === 'correct'
                ? 'bg-emerald-600/40 border-emerald-400 text-emerald-200 shadow-[0_0_20px_rgba(16,185,129,0.5)] scale-98'
                : feedback.audio === 'wrong'
                ? 'bg-rose-600/40 border-rose-400 text-rose-200 shadow-[0_0_20px_rgba(244,63,94,0.5)] scale-98'
                : 'bg-cyan-600/40 border-cyan-400 text-cyan-100'
              : 'bg-gradient-to-b from-cyan-900/60 to-slate-900 border-cyan-500/70 hover:border-cyan-400 text-white shadow-cyan-950/50 hover:shadow-cyan-500/20'
          }`}
        >
          <div className="flex items-center gap-1.5 mb-1">
            <div className="p-1.5 rounded-lg bg-cyan-500/20 text-cyan-400">
              <Volume2 className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            {currentResponse.audioPressed && feedback.audio === 'correct' && (
              <Check className="w-4 h-4 text-emerald-400 animate-bounce" />
            )}
            {currentResponse.audioPressed && feedback.audio === 'wrong' && (
              <X className="w-4 h-4 text-rose-400 animate-bounce" />
            )}
          </div>

          <div className="text-sm sm:text-base font-black tracking-wide leading-tight">
            聲音相同
          </div>
          <div className="text-[10px] sm:text-xs text-slate-400 mt-0.5">
            {nLevel} 步前字母
          </div>

          <kbd className="mt-2 px-2 py-0.5 rounded-md bg-slate-950/80 border border-cyan-500/30 text-[10px] sm:text-xs text-cyan-300 font-mono shadow-inner">
            按鍵 L
          </kbd>
        </button>
      </div>

      {/* Progress & Trial Counter */}
      {isPlaying && (
        <div className="w-full space-y-1">
          <div className="flex justify-between text-xs font-semibold text-slate-400">
            <span>回合進度 ({currentTrialIdx + 1} / {totalTrials})</span>
            <span className="text-indigo-400">{progressPercent}%</span>
          </div>
          <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden border border-slate-700/50">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 to-cyan-400 transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      )}

      {/* Start / Stop Bar */}
      <div className="w-full">
        {!isPlaying ? (
          <button
            onClick={handleStart}
            className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl bg-gradient-to-r from-indigo-500 to-cyan-500 hover:from-indigo-600 hover:to-cyan-600 text-white font-bold text-sm sm:text-base shadow-lg shadow-indigo-500/25 transition-all duration-150 active:scale-98"
          >
            <Play className="w-5 h-5 fill-current" />
            開始挑戰 ({nLevel}-Back)
          </button>
        ) : (
          <button
            onClick={onStop}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-rose-600/80 hover:bg-rose-700 border border-rose-500 text-white font-semibold text-sm transition-all duration-150 active:scale-98"
          >
            <Square className="w-4 h-4 fill-current" />
            結束目前回合
          </button>
        )}
      </div>
    </div>
  );
};
