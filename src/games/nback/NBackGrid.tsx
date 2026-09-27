import React from 'react';
import { NBackTrial, NBackMode } from '../../types';

interface NBackGridProps {
  currentStimulus: NBackTrial | null;
  showStimulus: boolean;
  mode: NBackMode;
  isPlaying: boolean;
}

export const NBackGrid: React.FC<NBackGridProps> = ({
  currentStimulus,
  showStimulus,
  mode,
  isPlaying,
}) => {
  const showPosition = mode === 'dual' || mode === 'position';
  const showLetterVisual = mode === 'audio' || (mode === 'dual' && false); // in classic Dual N-back, letter is auditory, but we can display letter indicator or sound icon

  return (
    <div className="relative flex flex-col items-center justify-center p-4">
      {/* 3x3 Grid */}
      <div className="grid grid-cols-3 gap-3 p-4 bg-slate-900/80 rounded-2xl border border-slate-800 shadow-2xl backdrop-blur-md w-72 h-72 sm:w-80 sm:h-80 md:w-96 md:h-96">
        {Array.from({ length: 9 }).map((_, index) => {
          const isActive = isPlaying && showStimulus && showPosition && currentStimulus?.position === index;

          return (
            <div
              key={index}
              className={`relative flex items-center justify-center rounded-xl transition-all duration-150 border ${
                isActive
                  ? 'bg-gradient-to-br from-indigo-500 to-blue-600 border-indigo-300 shadow-[0_0_25px_rgba(99,102,241,0.8)] scale-95'
                  : 'bg-slate-800/40 border-slate-700/50 hover:border-slate-600/60'
              }`}
            >
              {/* Inner glowing pulse when active */}
              {isActive && (
                <div className="absolute inset-0 rounded-xl bg-white/20 animate-ping opacity-40 pointer-events-none" />
              )}
            </div>
          );
        })}
      </div>

      {/* Audio Stimulus Visual Indicator (Shows sound wave or spoken letter when active) */}
      {(mode === 'dual' || mode === 'audio') && (
        <div className="mt-4 flex items-center gap-2 px-4 py-2 rounded-full bg-slate-800/80 border border-slate-700 text-sm">
          <span className="text-slate-400">聽覺刺激：</span>
          {showStimulus && currentStimulus ? (
            <div className="flex items-center gap-1.5 font-bold text-indigo-400 animate-pulse">
              <span className="inline-block w-2 h-2 rounded-full bg-indigo-500 animate-ping" />
              <span className="text-base tracking-widest font-mono">字母「{currentStimulus.letter}」</span>
            </div>
          ) : (
            <span className="text-slate-500 italic">聆聽語音...</span>
          )}
        </div>
      )}
    </div>
  );
};
