import React from 'react';
import { NBackTrial, NBackMode } from '../../types';
import { Volume2 } from 'lucide-react';

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

  return (
    <div className="relative flex flex-col items-center justify-center">
      {/* Audio Stimulus Visual Indicator positioned above grid */}
      {(mode === 'dual' || mode === 'audio') && (
        <div className="mb-3 flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-800/80 border border-slate-700/80 text-xs sm:text-sm">
          <Volume2 className="w-4 h-4 text-cyan-400" />
          <span className="text-slate-400">聽覺刺激：</span>
          {showStimulus && currentStimulus ? (
            <div className="flex items-center gap-1.5 font-bold text-cyan-300 animate-pulse">
              <span className="inline-block w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
              <span className="text-base tracking-widest font-mono">字母「{currentStimulus.letter}」</span>
            </div>
          ) : (
            <span className="text-slate-500 italic">等待聲音...</span>
          )}
        </div>
      )}

      {/* 3x3 Grid (九宮格) */}
      <div className="grid grid-cols-3 gap-2.5 sm:gap-3 p-3.5 sm:p-4 bg-slate-900/90 rounded-2xl border border-slate-800 shadow-2xl backdrop-blur-md w-72 h-72 sm:w-80 sm:h-80 md:w-96 md:h-96">
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
    </div>
  );
};
