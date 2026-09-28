import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GameHistoryEntry, GameId } from '../../types';
import { storage } from '../../utils/storage';
import { useAuth } from '../../context/AuthContext';
import { Trophy, History, Calendar, X, Sparkles, User, ChevronDown } from 'lucide-react';

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
  const [isOpen, setIsOpen] = useState(false);
  const [historyList, setHistoryList] = useState<GameHistoryEntry[]>([]);
  const [selectedRecordId, setSelectedRecordId] = useState<string>('');
  const [selectedRecord, setSelectedRecord] = useState<GameHistoryEntry | null>(null);
  const [userHighScore, setUserHighScore] = useState<number>(0);
  const popoverRef = useRef<HTMLDivElement>(null);

  const loadHistory = useCallback(() => {
    const list = storage.getGameHistory(gameId, user?.id, 'desc');
    setHistoryList(list);
    const hs = storage.getUserHighScore(gameId, user?.id);
    setUserHighScore(hs);
  }, [gameId, user?.id]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory, user?.id, displayName, currentScore]);

  // Click outside to close popover
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

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

  const handleQuickPick = (r: GameHistoryEntry) => {
    setSelectedRecordId(r.id);
    setSelectedRecord(r);
    if (onSelectRecord) onSelectRecord(r);
  };

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
    <div className={`relative inline-block ${className}`} ref={popoverRef}>
      {/* Compact Small Icon Button (做成小圖示放在最上面) */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition active:scale-95 shadow-sm ${
          isOpen
            ? 'bg-cyan-600 text-white border-cyan-400 ring-2 ring-cyan-400/30'
            : 'bg-slate-800/90 hover:bg-slate-750 border-slate-700/80 text-cyan-300 hover:text-white'
        }`}
        title="歷史玩過的分數與對局紀錄"
      >
        <History className="w-3.5 h-3.5 text-cyan-400" />
        <span>歷史分數</span>
        {historyList.length > 0 && (
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-cyan-500/20 text-cyan-200 border border-cyan-500/30 font-bold">
            {historyList.length}
          </span>
        )}
        <ChevronDown
          className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Dropdown Popover */}
      {isOpen && (
        <div className="absolute right-0 sm:right-auto sm:left-0 top-full mt-2 w-80 sm:w-96 z-50 p-3.5 rounded-2xl bg-slate-900/95 border border-cyan-500/40 shadow-2xl backdrop-blur-xl animate-fadeIn text-slate-200">
          {/* Popover Header */}
          <div className="flex items-center justify-between pb-2 mb-2.5 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <div className="p-1 rounded-lg bg-cyan-500/20 text-cyan-400">
                <History className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-bold text-white block">歷史玩過的分數</span>
                <span className="text-[10px] text-slate-400 flex items-center gap-1">
                  <User className="w-2.5 h-2.5 text-indigo-400" />
                  {displayName || '當前玩家'} 的紀錄
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[11px] text-amber-400 font-bold flex items-center gap-1">
                <Trophy className="w-3 h-3" />
                最高 {userHighScore}
              </span>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Past Scores Dropdown Selector */}
          <div className="mb-2.5">
            <select
              value={selectedRecordId}
              onChange={handleSelect}
              className="w-full pl-2.5 pr-6 py-1.5 rounded-xl bg-slate-800 border border-slate-700 hover:border-slate-600 text-xs text-slate-100 font-medium cursor-pointer focus:outline-none focus:ring-1 focus:ring-cyan-400 transition"
            >
              <option value="">
                {historyList.length > 0
                  ? `📜 點此快速選擇場次 (${historyList.length} 場) ▾`
                  : '📜 尚無歷史紀錄 (完成一局自動記錄) ▾'}
              </option>

              {historyList.map((r, idx) => {
                const summary = getRecordSummary(r);
                const isBest = r.score === userHighScore && userHighScore > 0;
                const isSample = r.isSample;

                return (
                  <option key={r.id} value={r.id} className="bg-slate-900 text-slate-100">
                    {isBest ? '👑 [最高] ' : isSample ? '💡 [範例] ' : `▸ 第 ${historyList.length - idx} 場 · `}
                    {r.score} 分 ({r.date}) {summary ? `— ${summary}` : ''}
                  </option>
                );
              })}
            </select>
          </div>

          {/* Selected Record Detail Inspection Card */}
          {selectedRecord ? (
            <div className="p-2.5 rounded-xl bg-indigo-950/40 border border-indigo-500/40 text-xs space-y-2 mb-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span className="font-bold text-indigo-200">場次詳細數據</span>
                </div>
                <button
                  type="button"
                  onClick={handleClearSelection}
                  className="text-[10px] text-slate-400 hover:text-white px-1.5 py-0.5 rounded bg-slate-800"
                >
                  清除選擇
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="p-1.5 rounded-lg bg-slate-900/80 border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">該場得分</span>
                  <span className="text-base font-black text-cyan-400">{selectedRecord.score} 分</span>
                </div>
                <div className="p-1.5 rounded-lg bg-slate-900/80 border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">遊玩時間</span>
                  <span className="text-xs font-semibold text-slate-200 flex items-center gap-1 mt-0.5">
                    <Calendar className="w-3 h-3 text-slate-400" />
                    {selectedRecord.date}
                  </span>
                </div>
              </div>

              {selectedRecord.details && (
                <div className="p-1.5 rounded-lg bg-slate-900/80 border border-slate-800 text-[11px] text-slate-300">
                  {gameId === 'nback' && (
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-semibold text-indigo-300">
                        {selectedRecord.details.nLevel || 2}-Back
                      </span>
                      <span>·</span>
                      <span className="font-semibold text-emerald-300">
                        正確率 {selectedRecord.details.accuracy ?? 0}%
                      </span>
                      <span>·</span>
                      <span className="text-slate-400">
                        {selectedRecord.details.mode === 'dual' ? '雙重模式' : selectedRecord.details.mode || '雙重'}
                      </span>
                    </div>
                  )}
                  {gameId === 'stroop' && (
                    <span className="font-semibold text-amber-300">
                      連續答對: {selectedRecord.details.streak ?? 0} 題
                    </span>
                  )}
                  {gameId === 'game2048' && (
                    <span className="font-semibold text-orange-300">
                      最大方塊: {selectedRecord.details.maxTile ?? 2048}
                    </span>
                  )}
                  {gameId === 'snake' && (
                    <span className="font-semibold text-green-300">
                      蛇身長度: {selectedRecord.details.length ?? 0} 格
                    </span>
                  )}
                </div>
              )}
            </div>
          ) : (
            /* Quick Clickable Recent Scores List */
            <div className="space-y-1 max-h-44 overflow-y-auto pr-1">
              <span className="text-[10px] uppercase font-bold text-slate-500 block mb-1">
                最近遊玩成績 (點擊檢視)：
              </span>
              {historyList.slice(0, 5).map((r, idx) => {
                const summary = getRecordSummary(r);
                const isBest = r.score === userHighScore && userHighScore > 0;

                return (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => handleQuickPick(r)}
                    className="w-full flex items-center justify-between p-1.5 rounded-lg bg-slate-800/60 hover:bg-slate-800 border border-slate-750 hover:border-slate-600 transition text-left text-xs active:scale-98"
                  >
                    <div className="flex items-center gap-1.5">
                      <span className="text-slate-400 font-mono text-[11px]">#{historyList.length - idx}</span>
                      <span className="font-bold text-white">{r.score} 分</span>
                      {summary && <span className="text-[10px] text-slate-400">({summary})</span>}
                    </div>
                    <div className="flex items-center gap-1.5">
                      {isBest && (
                        <span className="text-[9px] px-1 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold">
                          最佳
                        </span>
                      )}
                      <span className="text-[10px] text-slate-500">{r.date}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
