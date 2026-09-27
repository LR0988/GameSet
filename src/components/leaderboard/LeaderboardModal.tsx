import React, { useState, useEffect } from 'react';
import { GameId } from '../../types';
import { db, CloudScore } from '../../utils/supabase';
import { X, Trophy, Brain, Zap, Grid3X3, Gamepad2, Medal, RotateCw } from 'lucide-react';

interface LeaderboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultGame?: GameId;
}

export const LeaderboardModal: React.FC<LeaderboardModalProps> = ({
  isOpen,
  onClose,
  defaultGame = 'nback',
}) => {
  const [selectedGame, setSelectedGame] = useState<GameId>(defaultGame);
  const [scores, setScores] = useState<CloudScore[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchScores = async (gameId: string) => {
    setLoading(true);
    const data = await db.getLeaderboard(gameId);
    setScores(data);
    setLoading(false);
  };

  useEffect(() => {
    if (isOpen) {
      fetchScores(selectedGame);
    }
  }, [isOpen, selectedGame]);

  if (!isOpen) return null;

  const gameTabs: { id: GameId; label: string; icon: React.ReactNode }[] = [
    { id: 'nback', label: 'N-Back 記憶', icon: <Brain className="w-3.5 h-3.5" /> },
    { id: 'stroop', label: '斯特魯普', icon: <Zap className="w-3.5 h-3.5" /> },
    { id: 'game2048', label: '2048', icon: <Grid3X3 className="w-3.5 h-3.5" /> },
    { id: 'snake', label: '貪食蛇', icon: <Gamepad2 className="w-3.5 h-3.5" /> },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-850">
          <div className="flex items-center gap-2 font-bold text-lg text-white">
            <Trophy className="w-5 h-5 text-amber-400" />
            <span>全球腦力排行榜</span>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => fetchScores(selectedGame)}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              title="重新整理"
            >
              <RotateCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Game Tabs */}
        <div className="flex border-b border-slate-800 bg-slate-950/60 p-1.5 gap-1 overflow-x-auto">
          {gameTabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setSelectedGame(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                selectedGame === tab.id
                  ? 'bg-indigo-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Score List */}
        <div className="p-6 overflow-y-auto flex-1 space-y-2.5">
          {loading ? (
            <div className="text-center py-12 text-slate-400 text-xs flex items-center justify-center gap-2">
              <RotateCw className="w-4 h-4 animate-spin text-indigo-400" />
              <span>正在載入排行榜資料...</span>
            </div>
          ) : scores.length === 0 ? (
            <div className="text-center py-12 space-y-2">
              <div className="w-12 h-12 rounded-full bg-slate-800 mx-auto flex items-center justify-center text-slate-500">
                <Trophy className="w-6 h-6" />
              </div>
              <p className="text-slate-400 text-sm font-semibold">此遊戲目前尚無雲端排行資料</p>
              <p className="text-slate-500 text-xs max-w-xs mx-auto">
                登入帳號後進行遊戲，您的分數將會自動上傳至雲端排行榜！
              </p>
            </div>
          ) : (
            scores.map((item, index) => {
              const isTop1 = index === 0;
              const isTop2 = index === 1;
              const isTop3 = index === 2;

              return (
                <div
                  key={item.id || index}
                  className={`p-3 rounded-xl border flex items-center justify-between text-xs sm:text-sm transition ${
                    isTop1
                      ? 'bg-amber-500/10 border-amber-500/30'
                      : isTop2
                      ? 'bg-slate-300/10 border-slate-300/30'
                      : isTop3
                      ? 'bg-amber-700/10 border-amber-700/30'
                      : 'bg-slate-800/40 border-slate-700/40'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-6 text-center font-black">
                      {isTop1 ? (
                        <Medal className="w-5 h-5 text-amber-400 inline" />
                      ) : isTop2 ? (
                        <Medal className="w-5 h-5 text-slate-300 inline" />
                      ) : isTop3 ? (
                        <Medal className="w-5 h-5 text-amber-600 inline" />
                      ) : (
                        <span className="text-slate-500">{index + 1}</span>
                      )}
                    </div>
                    <div>
                      <div className="font-bold text-white flex items-center gap-1.5">
                        <span>{item.displayName || '匿名玩家'}</span>
                      </div>
                      <div className="text-[10px] text-slate-500">
                        {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : '近日'}
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="font-black text-amber-400 text-base">{item.score}</div>
                    <div className="text-[10px] text-slate-400 uppercase">得分</div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
