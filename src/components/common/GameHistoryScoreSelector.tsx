import React, { useState, useEffect, useCallback } from 'react';
import { GameHistoryEntry, GameId } from '../../types';
import { storage } from '../../utils/storage';
import { useAuth } from '../../context/AuthContext';
import { Trophy, History, Calendar, Award, X, Sparkles, User, ChevronDown } from 'lucide-react';

interface GameHistoryScoreSelectorProps {
  gameId: GameId;
  currentScore?: number;
  className?: string;
  onSelectRecord?: (record: GameHistoryEntry | null) => void;
}

export const GameHistoryScoreSelector: React.FC<GameHistoryScoreSelectorProps> = ({
  gameId,
  currentScore,
  className = '',
  onSelectRecord,
}) => {
  const { user, displayName } = useAuth();
  const [historyList, setHistoryList] = useState<GameHistoryEntry[]>([]);
  const [selectedRecordId, setSelectedRecordId] = useState<string>('');
  const [selectedRecord, setSelectedRecord] = useState<GameHistoryEntry | null>(null);
  const [userHighScore, setUserHighScore] = useState<number>(0);

  const loadHistory = useCallback(() => {
    const list = storage.getGameHistory(gameId, user?.id, 'desc');
    setHistoryList(list);
    const hs = storage.getUserHighScore(gameId, user?.id);
    setUserHighScore(hs);
  }, [gameId, user?.id]);

  useEffect(() => {
    loadHistory();
    setSelectedRecordId('');
    setSelectedRecord(null);
  }, [loadHistory, user?.id, displayName, currentScore]);

  const handleSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;
    setSelectedRecordId(id);
    if (!id) {
      setSelectedRecord(null);
      if (onSelectRecord) onSelectRecord(null);
      return;
    }

    const found = historyList.find(r => r.id === id) || null;
    setSelectedRecord(found);
    if (onSelectRecord) onSelectRecord(found);
  };

  const handleClearSelection = () => {
    setSelectedRecordId('');
    setSelectedRecord(null);
    if (onSelectRecord) onSelectRecord(null);
  };

  // Helper to format detail summary for options
  const getRecordSummary = (r: GameHistoryEntry) => {
    if (!r.details) return '';
    if (gameId === 'nback') {
      const lvl = r.details.nLevel ? `${r.details.nLevel}-Back` : '';
      const acc = r.details.accuracy !== undefined ? `正確率 ${r.details.accuracy}%` : '';
      return [lvl, acc].filter(Boolean).join(' · ');
    }
    if (gameId === 'stroop') {
      return r.details.streak ? `連對 ${r.details.streak} 題` : '';
    }
    if (gameId === 'game2048') {
      return r.details.maxTile ? `方塊 ${r.details.maxTile}` : '';
    }
    if (gameId === 'snake') {
      return r.details.length ? `長度 ${r.details.length} 格` : '';
    }
    return '';
  };

  return (
    <div className={`w-full max-w-4xl mx-auto ${className}`}>
      {/* Dropdown Selector Bar */}
      <div className="w-full p-2.5 sm:p-3 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-md backdrop-blur-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          {/* Label & Active User */}
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-cyan-500/20 text-cyan-400">
              <History className="w-4 h-4" />
            </div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs sm:text-sm font-bold text-white tracking-wide">
                歷史玩過的分數：
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-semibold flex items-center gap-1">
                <User className="w-3 h-3 text-indigo-400" />
                {displayName || '當前玩家'}
              </span>
              <span className="text-[11px] text-amber-400 font-semibold flex items-center gap-1 ml-1">
                <Trophy className="w-3 h-3" />
                最高 {userHighScore} 分
              </span>
            </div>
          </div>

          {/* Dropdown element */}
          <div className="relative flex-1 max-w-full sm:max-w-md">
            <select
              value={selectedRecordId}
              onChange={handleSelect}
              className="w-full appearance-none pl-3 pr-8 py-2 rounded-xl bg-slate-800/90 hover:bg-slate-750 border border-slate-700 hover:border-slate-600 text-xs sm:text-sm text-slate-100 font-medium cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500 transition shadow-inner"
            >
              <option value="">
                {historyList.length > 0
                  ? `📜 點此選擇之前玩過的分數 (共 ${historyList.length} 筆歷史紀錄) ▾`
                  : '📜 尚無此遊戲歷史紀錄 (完成一局後自動加入) ▾'}
              </option>

              {historyList.map((r, idx) => {
                const summary = getRecordSummary(r);
                const isBest = r.score === userHighScore && userHighScore > 0;
                const isSample = r.isSample;

                return (
                  <option key={r.id} value={r.id} className="bg-slate-900 text-slate-100">
                    {isBest ? '👑 [最高分] ' : isSample ? '💡 [範例] ' : `▸ 第 ${historyList.length - idx} 場 · `}
                    {r.score} 分 ({r.date}) {summary ? `— ${summary}` : ''}
                  </option>
                );
              })}
            </select>
            <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* Selected Historical Score Inspection Panel */}
        {selectedRecord && (
          <div className="mt-3 p-3.5 rounded-xl bg-gradient-to-r from-indigo-950/70 via-slate-900 to-indigo-950/70 border border-indigo-500/50 shadow-lg animate-fadeIn text-slate-200">
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-indigo-500/30">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400 animate-spin-slow" />
                <span className="text-xs font-bold text-indigo-200">歷史紀錄詳情回顧</span>
                {selectedRecord.score === userHighScore && userHighScore > 0 ? (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 font-black">
                    👑 玩家個人歷史最佳
                  </span>
                ) : (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400">
                    距最高分差 {Math.max(0, userHighScore - selectedRecord.score)} 分
                  </span>
                )}
              </div>

              <button
                onClick={handleClearSelection}
                className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-white px-2 py-0.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 transition"
              >
                <X className="w-3.5 h-3.5" />
                <span>關閉檢視</span>
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div className="p-2 rounded-lg bg-slate-900/80 border border-slate-800">
                <span className="text-[10px] text-slate-400 block font-medium">該場得分</span>
                <span className="text-lg font-black text-cyan-400">{selectedRecord.score} 分</span>
              </div>

              <div className="p-2 rounded-lg bg-slate-900/80 border border-slate-800">
                <span className="text-[10px] text-slate-400 block font-medium">對局時間</span>
                <span className="text-xs font-bold text-slate-200 flex items-center gap-1 mt-0.5">
                  <Calendar className="w-3 h-3 text-slate-400" />
                  {selectedRecord.date}
                </span>
              </div>

              <div className="p-2 rounded-lg bg-slate-900/80 border border-slate-800 col-span-2">
                <span className="text-[10px] text-slate-400 block font-medium">詳細指標數據</span>
                <div className="flex items-center gap-2 mt-0.5 flex-wrap text-xs">
                  {gameId === 'nback' && (
                    <>
                      <span className="font-semibold text-indigo-300">
                        難度: {selectedRecord.details?.nLevel || 2}-Back
                      </span>
                      <span className="text-slate-500">|</span>
                      <span className="font-semibold text-emerald-300">
                        正確率: {selectedRecord.details?.accuracy ?? 0}%
                      </span>
                      <span className="text-slate-500">|</span>
                      <span className="text-slate-400">
                        模式: {selectedRecord.details?.mode === 'dual' ? '雙重 (位置+語音)' : selectedRecord.details?.mode || '雙重'}
                      </span>
                    </>
                  )}

                  {gameId === 'stroop' && (
                    <span className="font-semibold text-amber-300">
                      最高抗干擾連擊: {selectedRecord.details?.streak ?? 0} 連對
                    </span>
                  )}

                  {gameId === 'game2048' && (
                    <span className="font-semibold text-orange-300">
                      合成最大方塊: {selectedRecord.details?.maxTile ?? 2048}
                    </span>
                  )}

                  {gameId === 'snake' && (
                    <span className="font-semibold text-green-300">
                      貪食蛇結算長度: {selectedRecord.details?.length ?? 0} 格
                    </span>
                  )}

                  {!selectedRecord.details && (
                    <span className="text-slate-400">一般紀錄模式</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
