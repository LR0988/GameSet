import React, { useState, useMemo } from 'react';
import { GameId, GameHistoryEntry } from '../../types';
import { storage } from '../../utils/storage';
import { ScoreTrendChart } from './ScoreTrendChart';
import { X, TrendingUp, Trophy, Target, Gamepad2, Brain, Zap, Grid3X3, Award, Calendar, ArrowUpRight, Flame, Sparkles } from 'lucide-react';
import { sound } from '../../utils/sound';

interface AnalyticsModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialGameId?: GameId;
}

const GAME_TABS: { id: GameId | 'all'; label: string; icon: React.ReactNode; color: string; lineHex: string }[] = [
  { id: 'nback', label: 'N-Back 記憶', icon: <Brain className="w-4 h-4" />, color: 'text-indigo-400', lineHex: '#6366f1' },
  { id: 'stroop', label: '斯特魯普抗干擾', icon: <Zap className="w-4 h-4" />, color: 'text-amber-400', lineHex: '#f59e0b' },
  { id: 'game2048', label: '2048 拼圖', icon: <Grid3X3 className="w-4 h-4" />, color: 'text-emerald-400', lineHex: '#10b981' },
  { id: 'snake', label: '經典貪食蛇', icon: <Gamepad2 className="w-4 h-4" />, color: 'text-cyan-400', lineHex: '#06b6d4' },
  { id: 'all', label: '全遊戲總覽', icon: <Award className="w-4 h-4" />, color: 'text-purple-400', lineHex: '#a855f7' },
];

export const AnalyticsModal: React.FC<AnalyticsModalProps> = ({
  isOpen,
  onClose,
  initialGameId = 'nback',
}) => {
  const [selectedGame, setSelectedGame] = useState<GameId | 'all'>(initialGameId);
  const [timeframe, setTimeframe] = useState<'all' | '10' | '5'>('all');

  if (!isOpen) return null;

  const currentTab = GAME_TABS.find(t => t.id === selectedGame) || GAME_TABS[0];

  // Fetch history for selected game
  const rawData = useMemo(() => {
    if (selectedGame === 'all') {
      return storage.getGameHistory();
    }
    return storage.getGameHistory(selectedGame);
  }, [selectedGame, isOpen]);

  // Apply timeframe filter
  const filteredData = useMemo(() => {
    if (timeframe === '5') return rawData.slice(-5);
    if (timeframe === '10') return rawData.slice(-10);
    return rawData;
  }, [rawData, timeframe]);

  // Key performance calculations
  const scores = filteredData.map(d => d.score);
  const highScore = scores.length > 0 ? Math.max(...scores) : 0;
  const avgScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
  const totalPlays = rawData.length;

  // Trend growth calculation: compare last half vs first half
  const trendPercentage = useMemo(() => {
    if (scores.length < 2) return null;
    const mid = Math.floor(scores.length / 2);
    const firstHalf = scores.slice(0, mid);
    const secondHalf = scores.slice(mid);
    const avg1 = firstHalf.reduce((a, b) => a + b, 0) / (firstHalf.length || 1);
    const avg2 = secondHalf.reduce((a, b) => a + b, 0) / (secondHalf.length || 1);
    if (avg1 === 0) return 0;
    return Math.round(((avg2 - avg1) / avg1) * 100);
  }, [scores]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-3xl bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/80">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/30">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base sm:text-lg text-white flex items-center gap-2">
                腦力數據與分數趨勢分析
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  即時統計
                </span>
              </h3>
              <p className="text-xs text-slate-400">追蹤大腦工作記憶、反射速度與認知成長曲線</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Game Switcher Tabs */}
        <div className="flex overflow-x-auto px-6 py-2.5 border-b border-slate-800/80 bg-slate-950/40 gap-2">
          {GAME_TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => {
                sound.playClick();
                setSelectedGame(tab.id);
              }}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                selectedGame === tab.id
                  ? 'bg-slate-800 border border-slate-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850'
              }`}
            >
              <span className={tab.color}>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Key Metric Highlights Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {/* High Score */}
            <div className="p-3.5 rounded-2xl bg-slate-800/50 border border-slate-700/60 flex flex-col justify-between">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>最高歷史得分</span>
                <Trophy className="w-4 h-4 text-amber-400" />
              </div>
              <div className="font-extrabold text-xl sm:text-2xl text-amber-400 mt-2">
                {highScore}
              </div>
              <div className="text-[10px] text-slate-500 mt-1">個人生涯最佳紀錄</div>
            </div>

            {/* Average Score */}
            <div className="p-3.5 rounded-2xl bg-slate-800/50 border border-slate-700/60 flex flex-col justify-between">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>平均得分</span>
                <Target className="w-4 h-4 text-cyan-400" />
              </div>
              <div className="font-extrabold text-xl sm:text-2xl text-cyan-400 mt-2">
                {avgScore}
              </div>
              <div className="text-[10px] text-slate-500 mt-1">整體平均表現</div>
            </div>

            {/* Growth Trend */}
            <div className="p-3.5 rounded-2xl bg-slate-800/50 border border-slate-700/60 flex flex-col justify-between">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>近期進步幅度</span>
                <ArrowUpRight className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="font-extrabold text-xl sm:text-2xl text-emerald-400 mt-2 flex items-center gap-1">
                {trendPercentage !== null ? (
                  <>
                    <span>{trendPercentage >= 0 ? `+${trendPercentage}%` : `${trendPercentage}%`}</span>
                    {trendPercentage > 0 && <Flame className="w-4 h-4 text-orange-400 animate-pulse" />}
                  </>
                ) : (
                  <span>穩定進展</span>
                )}
              </div>
              <div className="text-[10px] text-slate-500 mt-1">對比前半段成長</div>
            </div>

            {/* Total Games */}
            <div className="p-3.5 rounded-2xl bg-slate-800/50 border border-slate-700/60 flex flex-col justify-between">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>累計訓練局數</span>
                <Gamepad2 className="w-4 h-4 text-indigo-400" />
              </div>
              <div className="font-extrabold text-xl sm:text-2xl text-indigo-300 mt-2">
                {totalPlays}
              </div>
              <div className="text-[10px] text-slate-500 mt-1">局大腦挑戰鍛鍊</div>
            </div>
          </div>

          {/* Interactive Score Trend Chart Card */}
          <div className="p-5 rounded-3xl bg-slate-850/80 border border-slate-700/80 shadow-xl space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: currentTab.lineHex }} />
                <h4 className="font-bold text-sm text-white flex items-center gap-1.5">
                  {currentTab.label} · 分數變化趨勢圖
                </h4>
              </div>

              {/* Timeframe selector */}
              <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800 text-[11px]">
                <button
                  onClick={() => setTimeframe('5')}
                  className={`px-2.5 py-1 rounded-lg transition font-medium ${
                    timeframe === '5' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  近 5 局
                </button>
                <button
                  onClick={() => setTimeframe('10')}
                  className={`px-2.5 py-1 rounded-lg transition font-medium ${
                    timeframe === '10' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  近 10 局
                </button>
                <button
                  onClick={() => setTimeframe('all')}
                  className={`px-2.5 py-1 rounded-lg transition font-medium ${
                    timeframe === 'all' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  全部 ({rawData.length})
                </button>
              </div>
            </div>

            {/* SVG Render */}
            <div className="w-full pt-2">
              <ScoreTrendChart
                data={filteredData}
                color={currentTab.lineHex}
                gradientId={`chart_${selectedGame}`}
              />
            </div>
          </div>

          {/* Game Insights / Breakdown */}
          <div className="p-4 rounded-2xl bg-indigo-950/30 border border-indigo-500/20 text-xs text-slate-300 space-y-2">
            <div className="font-bold text-sm text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <span>大腦認知解析洞察 (Cognitive Insights)</span>
            </div>
            {selectedGame === 'nback' && (
              <p className="leading-relaxed">
                N-Back 是經過神經科學驗證能直接鍛鍊<strong>工作記憶（Working Memory）與流體智力（Fluid Intelligence）</strong>的核心工具。維持 ≥80% 正確率將自動晉升難度，持續鍛鍊可顯著提升抗分心能力！
              </p>
            )}
            {selectedGame === 'stroop' && (
              <p className="leading-relaxed">
                斯特魯普測驗測試的是<strong>前額葉皮質的執行抑制功能（Inhibitory Control）</strong>。當文字意義與字體顏色衝突時，快速做出正確判斷能鍛鍊大腦在高度干擾下的反應力。
              </p>
            )}
            {selectedGame === 'game2048' && (
              <p className="leading-relaxed">
                2048 鍛鍊<strong>前瞻空間規劃（Spatial Planning）與決策佈局</strong>。將最大數字保持在邊角是邁向 2048、4096 的關鍵策略思維。
              </p>
            )}
            {selectedGame === 'snake' && (
              <p className="leading-relaxed">
                經典貪食蛇鍛鍊<strong>瞬態路徑規劃與手眼協調速度</strong>。隨著蛇身增長，空間約束力越強，越考驗冷靜度與耐性！
              </p>
            )}
            {selectedGame === 'all' && (
              <p className="leading-relaxed">
                全方位鍛鍊有助於全面活化腦神經迴路！建議每日進行 10-15 分鐘混合訓練，效果最為顯著。
              </p>
            )}
          </div>

          {/* Recent Records Table */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm font-bold text-white">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-slate-400" />
                <span>近期對局詳細明細</span>
              </div>
              <span className="text-xs text-slate-500 font-normal">顯示最近 {Math.min(10, filteredData.length)} 場</span>
            </div>

            <div className="divide-y divide-slate-800 rounded-2xl bg-slate-800/40 border border-slate-700/60 overflow-hidden">
              {filteredData.slice(-10).reverse().map((entry, idx) => (
                <div
                  key={entry.id || idx}
                  className="p-3.5 flex items-center justify-between hover:bg-slate-800/80 transition text-xs sm:text-sm"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-lg bg-slate-750 text-slate-400 font-mono text-xs flex items-center justify-center">
                      #{filteredData.length - idx}
                    </div>
                    <div>
                      <div className="font-bold text-white flex items-center gap-2">
                        <span className="capitalize">{entry.gameId}</span>
                        {entry.details?.nLevel && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                            {entry.details.nLevel}-Back
                          </span>
                        )}
                        {entry.details?.accuracy && (
                          <span className="text-[10px] text-emerald-400">
                            正確率 {entry.details.accuracy}%
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">{entry.date}</div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="font-extrabold text-base text-amber-400">
                      {entry.score} <span className="text-xs font-normal text-slate-400">分</span>
                    </div>
                    {entry.details?.streak && (
                      <div className="text-[10px] text-cyan-300">連勝 {entry.details.streak} 次</div>
                    )}
                    {entry.details?.maxTile && (
                      <div className="text-[10px] text-emerald-300">方塊 {entry.details.maxTile}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950 flex items-center justify-end px-6">
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs sm:text-sm shadow-md transition"
          >
            完成檢視
          </button>
        </div>
      </div>
    </div>
  );
};
