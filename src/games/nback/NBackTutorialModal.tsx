import React, { useState } from 'react';
import { X, HelpCircle, ArrowRight, CheckCircle2, MapPin, Volume2 } from 'lucide-react';

interface NBackTutorialModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NBackTutorialModal: React.FC<NBackTutorialModalProps> = ({ isOpen, onClose }) => {
  const [tab, setTab] = useState<'basics' | '2back' | 'dual'>('basics');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-850">
          <div className="flex items-center gap-2.5 text-white font-bold text-lg">
            <HelpCircle className="w-5 h-5 text-indigo-400" />
            <span>N-Back 新手規則圖解教學</span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="flex border-b border-slate-800 bg-slate-950/60 p-1">
          <button
            onClick={() => setTab('basics')}
            className={`flex-1 py-2 text-xs sm:text-sm font-semibold rounded-lg transition ${
              tab === 'basics' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            什麼是 N-Back？
          </button>
          <button
            onClick={() => setTab('2back')}
            className={`flex-1 py-2 text-xs sm:text-sm font-semibold rounded-lg transition ${
              tab === '2back' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            2-Back 範例解說
          </button>
          <button
            onClick={() => setTab('dual')}
            className={`flex-1 py-2 text-xs sm:text-sm font-semibold rounded-lg transition ${
              tab === 'dual' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            雙重 Dual N-Back
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-4 text-sm text-slate-300 overflow-y-auto max-h-[70vh]">
          {tab === 'basics' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl bg-indigo-950/40 border border-indigo-500/20 text-indigo-200">
                <p className="font-semibold mb-1">🧠 科學認證的大腦工作記憶訓練</p>
                <p className="text-xs text-indigo-300 leading-relaxed">
                  N-Back 任務廣泛應用於認知心理學與神經科學領域，經研究證實持續訓練有助於提升<strong>工作記憶容量 (Working Memory)</strong>、專注力與流體智力。
                </p>
              </div>

              <div>
                <h4 className="font-bold text-white mb-2">🎯 基本規則：</h4>
                <p className="text-slate-300 leading-relaxed mb-3">
                  畫面會依序出現刺激（例如 3x3 網格中的位置，或聽見英文字母）。您的任務是判斷：<strong>當前的刺激是否與「N 步前」完全相同？</strong>
                </p>
                <ul className="space-y-2 text-xs sm:text-sm text-slate-300 list-disc list-inside">
                  <li><strong>1-Back：</strong>與「剛好前 1 步」相同就按下按鍵。</li>
                  <li><strong>2-Back：</strong>與「前 2 步」相同就按下按鍵。</li>
                  <li><strong>3-Back：</strong>與「前 3 步」相同就按下按鍵。</li>
                </ul>
              </div>
            </div>
          )}

          {tab === '2back' && (
            <div className="space-y-4">
              <h4 className="font-bold text-white">👀 2-Back 視覺示範：</h4>
              <p className="text-xs text-slate-400">假設網格出現的位置序列如下（從左至右）：</p>

              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-800/80 border border-slate-700 text-xs">
                <div className="text-center">
                  <div className="w-10 h-10 rounded-lg bg-slate-700 flex items-center justify-center font-bold text-indigo-300 border border-indigo-500/40">左上</div>
                  <span className="text-[10px] text-slate-400 mt-1 block">第 1 步</span>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-500" />
                <div className="text-center">
                  <div className="w-10 h-10 rounded-lg bg-slate-700 flex items-center justify-center font-bold text-cyan-300 border border-cyan-500/40">中間</div>
                  <span className="text-[10px] text-slate-400 mt-1 block">第 2 步</span>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-500" />
                <div className="text-center">
                  <div className="w-10 h-10 rounded-lg bg-indigo-600 flex items-center justify-center font-bold text-white border-2 border-indigo-400 animate-pulse">左上</div>
                  <span className="text-[10px] text-emerald-400 font-bold mt-1 block">第 3 步 (按A!)</span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-xs leading-relaxed">
                <CheckCircle2 className="w-4 h-4 inline-block mr-1 text-emerald-400" />
                在第 3 步時，位置「左上」正好與 <strong>2 步前（第 1 步）的「左上」</strong> 相同！此時立刻按下【位置相同】按鍵（或鍵盤 A）！
              </div>
            </div>
          )}

          {tab === 'dual' && (
            <div className="space-y-4">
              <h4 className="font-bold text-white">⚡ Dual N-Back 雙通道同時挑戰：</h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                在雙重模式中，每一輪刺激會<strong>同時出現「視覺網格方塊」與「語音字母朗讀」</strong>。
              </p>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-slate-800/80 border border-indigo-500/40">
                  <div className="flex items-center gap-1.5 font-bold text-indigo-400 mb-1 text-xs">
                    <MapPin className="w-4 h-4" />
                    <span>位置通道</span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    若目前網格方塊位置與 N 步前相同，按 <strong>鍵盤 A</strong>。
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-slate-800/80 border border-cyan-500/40">
                  <div className="flex items-center gap-1.5 font-bold text-cyan-400 mb-1 text-xs">
                    <Volume2 className="w-4 h-4" />
                    <span>聽覺通道</span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    若目前聽到的字母發音與 N 步前相同，按 <strong>鍵盤 L</strong>。
                  </p>
                </div>
              </div>

              <p className="text-xs text-slate-400 italic">
                提示：若兩者皆符合，可同時按下 A 與 L 鍵！
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-850 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm transition"
          >
            我明白了，開始遊戲！
          </button>
        </div>
      </div>
    </div>
  );
};
