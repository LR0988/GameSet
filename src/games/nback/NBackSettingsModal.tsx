import React from 'react';
import { NBackSettings, NBackMode } from '../../types';
import { storage } from '../../utils/storage';
import { sound } from '../../utils/sound';
import { X, Sliders, Volume2, VolumeX, Zap } from 'lucide-react';

interface NBackSettingsModalProps {
  isOpen: boolean;
  settings: NBackSettings;
  onClose: () => void;
  onUpdate: (newSettings: NBackSettings) => void;
}

export const NBackSettingsModal: React.FC<NBackSettingsModalProps> = ({
  isOpen,
  settings,
  onClose,
  onUpdate,
}) => {
  if (!isOpen) return null;

  const handleChange = (partial: Partial<NBackSettings>) => {
    const updated = { ...settings, ...partial };
    if (partial.soundEnabled !== undefined) {
      sound.setMuted(!partial.soundEnabled);
    }
    onUpdate(updated);
    storage.saveNBackSettings(updated);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-850">
          <div className="flex items-center gap-2.5 text-white font-bold text-lg">
            <Sliders className="w-5 h-5 text-indigo-400" />
            <span>N-Back 遊戲設定</span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6 space-y-5 overflow-y-auto max-h-[80vh]">
          {/* Mode Selection */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-300">訓練模式 (Mode)</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'dual', label: '雙重 (Dual)', desc: '位置 + 聽覺' },
                { id: 'position', label: '空間位置', desc: '單純位置' },
                { id: 'audio', label: '聽覺語音', desc: '單純字母' },
              ].map(m => (
                <button
                  key={m.id}
                  onClick={() => handleChange({ mode: m.id as NBackMode })}
                  className={`p-2.5 rounded-xl border text-center transition flex flex-col items-center gap-1 ${
                    settings.mode === m.id
                      ? 'bg-indigo-600/30 border-indigo-500 text-indigo-200'
                      : 'bg-slate-800/40 border-slate-700/60 text-slate-400 hover:bg-slate-800'
                  }`}
                >
                  <span className="font-bold text-xs sm:text-sm">{m.label}</span>
                  <span className="text-[10px] text-slate-400">{m.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* N Level */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-sm font-semibold text-slate-300">難度等級 (N-Level)</label>
              <span className="text-base font-bold text-indigo-400 px-2 py-0.5 bg-indigo-500/10 rounded-md border border-indigo-500/20">
                {settings.nLevel}-Back
              </span>
            </div>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map(lvl => (
                <button
                  key={lvl}
                  onClick={() => handleChange({ nLevel: lvl })}
                  className={`flex-1 py-2 rounded-lg font-bold text-sm border transition ${
                    settings.nLevel === lvl
                      ? 'bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-500/20'
                      : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-750'
                  }`}
                >
                  {lvl}
                </button>
              ))}
            </div>
            <p className="text-xs text-slate-500">
              {settings.nLevel === 1 && '入門：回憶前 1 步的刺激（適合初學者）'}
              {settings.nLevel === 2 && '標準：回憶前 2 步的刺激（推薦日常鍛鍊）'}
              {settings.nLevel === 3 && '進階：回憶前 3 步的刺激（高度專注挑戰）'}
              {settings.nLevel >= 4 && '天才級：極限工作記憶挑戰！'}
            </p>
          </div>

          {/* Adaptive Difficulty Toggle */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-800/40 border border-slate-700/50">
            <div className="flex items-center gap-2.5">
              <Zap className="w-5 h-5 text-amber-400" />
              <div>
                <div className="text-sm font-semibold text-slate-200">自適應難度 (Adaptive)</div>
                <div className="text-xs text-slate-400">正確率 ≥80% 自動升級，&lt;50% 降級</div>
              </div>
            </div>
            <input
              type="checkbox"
              checked={settings.adaptiveDifficulty}
              onChange={e => handleChange({ adaptiveDifficulty: e.target.checked })}
              className="w-5 h-5 rounded accent-indigo-500 cursor-pointer"
            />
          </div>

          {/* Interval Duration (Speed) */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-300">刺激間隔時間 (節奏速度)</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { time: 3000, label: '放鬆 (3.0s)' },
                { time: 2500, label: '標準 (2.5s)' },
                { time: 2000, label: '敏捷 (2.0s)' },
              ].map(speed => (
                <button
                  key={speed.time}
                  onClick={() => handleChange({ intervalDuration: speed.time })}
                  className={`py-2 px-1 rounded-lg text-xs font-semibold border transition text-center ${
                    settings.intervalDuration === speed.time
                      ? 'bg-cyan-600/30 border-cyan-500 text-cyan-200'
                      : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-750'
                  }`}
                >
                  {speed.label}
                </button>
              ))}
            </div>
          </div>

          {/* Sound Toggle */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-800/40 border border-slate-700/50">
            <div className="flex items-center gap-2.5">
              {settings.soundEnabled ? (
                <Volume2 className="w-5 h-5 text-indigo-400" />
              ) : (
                <VolumeX className="w-5 h-5 text-slate-500" />
              )}
              <div>
                <div className="text-sm font-semibold text-slate-200">音效與字母語音</div>
                <div className="text-xs text-slate-400">包含 Web Audio 與語音朗讀</div>
              </div>
            </div>
            <input
              type="checkbox"
              checked={settings.soundEnabled}
              onChange={e => handleChange({ soundEnabled: e.target.checked })}
              className="w-5 h-5 rounded accent-indigo-500 cursor-pointer"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-850 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm transition"
          >
            完成設定
          </button>
        </div>
      </div>
    </div>
  );
};
