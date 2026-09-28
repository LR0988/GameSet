import React, { useState, useEffect, useCallback, useRef } from 'react';
import { sound } from '../../utils/sound';
import { storage } from '../../utils/storage';
import { Trophy, RotateCcw, TrendingUp, Sliders, HelpCircle, Volume2, VolumeX, Sparkles, CheckCircle2, AlertTriangle } from 'lucide-react';
import confetti from 'canvas-confetti';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../utils/supabase';
import { ScoreTrendChart } from '../../components/analytics/ScoreTrendChart';

type Grid = number[][];

const TILE_COLORS: Record<number, { bg: string; text: string }> = {
  2: { bg: 'bg-amber-100', text: 'text-slate-800' },
  4: { bg: 'bg-amber-200', text: 'text-slate-800' },
  8: { bg: 'bg-orange-400', text: 'text-white' },
  16: { bg: 'bg-orange-500', text: 'text-white' },
  32: { bg: 'bg-rose-500', text: 'text-white' },
  64: { bg: 'bg-rose-600', text: 'text-white' },
  128: { bg: 'bg-yellow-400', text: 'text-white' },
  256: { bg: 'bg-yellow-500', text: 'text-white' },
  512: { bg: 'bg-emerald-500', text: 'text-white' },
  1024: { bg: 'bg-emerald-600', text: 'text-white' },
  2048: { bg: 'bg-cyan-500', text: 'text-white' },
  4096: { bg: 'bg-purple-600', text: 'text-white' },
};

export const Game2048: React.FC = () => {
  const { user, displayName } = useAuth();
  const [activeTab, setActiveTab] = useState<'train' | 'settings' | 'analytics' | 'tutorial'>('train');

  // Sound & Test State
  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => !sound.getMuted());
  const [isTestingSound, setIsTestingSound] = useState<boolean>(false);
  const [soundNotice, setSoundNotice] = useState<string | null>(null);

  // Settings
  const [targetGoal, setTargetGoal] = useState<number>(2048);

  // Gameplay State
  const [board, setBoard] = useState<Grid>([
    [0, 0, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
  ]);
  const [score, setScore] = useState<number>(0);
  const [highScore, setHighScore] = useState<number>(0);
  const [gameOver, setGameOver] = useState<boolean>(false);
  const [won, setWon] = useState<boolean>(false);

  useEffect(() => {
    setHighScore(storage.getUserHighScore('game2048', user?.id));
  }, [user]);

  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  const handleToggleSound = () => {
    const nextVal = !soundEnabled;
    setSoundEnabled(nextVal);
    sound.setMuted(!nextVal);
    if (nextVal) {
      sound.unlockAudio();
      sound.playClick();
    }
  };

  const handleTestSound = () => {
    if (sound.getMuted()) {
      sound.setMuted(false);
      setSoundEnabled(true);
    }
    setIsTestingSound(true);
    sound.testSound();
    setSoundNotice('正在播放測試音效（三連音階 + 語音）！若未聽見，請檢查音量或分頁靜音設定。');

    setTimeout(() => {
      setIsTestingSound(false);
    }, 1200);

    setTimeout(() => {
      setSoundNotice(null);
    }, 5000);
  };

  const spawnTile = (grid: Grid): Grid => {
    const emptyCells: { r: number; c: number }[] = [];
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        if (grid[r][c] === 0) emptyCells.push({ r, c });
      }
    }
    if (emptyCells.length === 0) return grid;
    const { r, c } = emptyCells[Math.floor(Math.random() * emptyCells.length)];
    const newGrid = grid.map(row => [...row]);
    newGrid[r][c] = Math.random() < 0.9 ? 2 : 4;
    return newGrid;
  };

  const initGame = () => {
    let grid: Grid = [
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ];
    grid = spawnTile(grid);
    grid = spawnTile(grid);
    setBoard(grid);
    setScore(0);
    setGameOver(false);
    setWon(false);
    sound.playClick();
  };

  useEffect(() => {
    initGame();
  }, []);

  const slideRow = (row: number[]): { newRow: number[]; gainedScore: number; moved: boolean } => {
    const filtered = row.filter(val => val !== 0);
    const newRow: number[] = [];
    let gainedScore = 0;
    let moved = false;

    for (let i = 0; i < filtered.length; i++) {
      if (i < filtered.length - 1 && filtered[i] === filtered[i + 1]) {
        const merged = filtered[i] * 2;
        newRow.push(merged);
        gainedScore += merged;
        i++; // skip next
      } else {
        newRow.push(filtered[i]);
      }
    }

    while (newRow.length < 4) {
      newRow.push(0);
    }

    for (let i = 0; i < 4; i++) {
      if (row[i] !== newRow[i]) moved = true;
    }

    return { newRow, gainedScore, moved };
  };

  const move = useCallback(
    (direction: 'up' | 'down' | 'left' | 'right') => {
      if (gameOver) return;

      let hasMoved = false;
      let gained = 0;
      const newGrid = board.map(r => [...r]);

      if (direction === 'left') {
        for (let r = 0; r < 4; r++) {
          const res = slideRow(newGrid[r]);
          newGrid[r] = res.newRow;
          gained += res.gainedScore;
          if (res.moved) hasMoved = true;
        }
      } else if (direction === 'right') {
        for (let r = 0; r < 4; r++) {
          const res = slideRow([...newGrid[r]].reverse());
          newGrid[r] = res.newRow.reverse();
          gained += res.gainedScore;
          if (res.moved) hasMoved = true;
        }
      } else if (direction === 'up') {
        for (let c = 0; c < 4; c++) {
          const col = [newGrid[0][c], newGrid[1][c], newGrid[2][c], newGrid[3][c]];
          const res = slideRow(col);
          for (let r = 0; r < 4; r++) newGrid[r][c] = res.newRow[r];
          gained += res.gainedScore;
          if (res.moved) hasMoved = true;
        }
      } else if (direction === 'down') {
        for (let c = 0; c < 4; c++) {
          const col = [newGrid[3][c], newGrid[2][c], newGrid[1][c], newGrid[0][c]];
          const res = slideRow(col);
          for (let r = 0; r < 4; r++) newGrid[3 - r][c] = res.newRow[r];
          gained += res.gainedScore;
          if (res.moved) hasMoved = true;
        }
      }

      if (hasMoved) {
        sound.playClick();
        if (gained > 0) {
          sound.playCorrect();
        }
        const updatedGrid = spawnTile(newGrid);
        const newScore = score + gained;
        setBoard(updatedGrid);
        setScore(newScore);

        if (newScore > highScore) {
          setHighScore(newScore);
          storage.saveHighScore('game2048', newScore);
        }

        // Check win condition based on user goal
        let hasReachedGoal = false;
        for (let r = 0; r < 4; r++) {
          for (let c = 0; c < 4; c++) {
            if (updatedGrid[r][c] >= targetGoal) hasReachedGoal = true;
          }
        }
        if (hasReachedGoal && !won) {
          setWon(true);
          sound.playLevelUp();
          confetti({ particleCount: 100, spread: 70 });
        }

        // Check Game Over
        let canMove = false;
        for (let r = 0; r < 4; r++) {
          for (let c = 0; c < 4; c++) {
            if (updatedGrid[r][c] === 0) canMove = true;
            if (r < 3 && updatedGrid[r][c] === updatedGrid[r + 1][c]) canMove = true;
            if (c < 3 && updatedGrid[r][c] === updatedGrid[r][c + 1]) canMove = true;
          }
        }
        if (!canMove) {
          setGameOver(true);
          sound.playGameOver();
          let maxTile = 0;
          for (let r = 0; r < 4; r++) {
            for (let c = 0; c < 4; c++) {
              if (updatedGrid[r][c] > maxTile) maxTile = updatedGrid[r][c];
            }
          }
          if (newScore > 0) {
            storage.saveGameRecord({
              gameId: 'game2048',
              score: newScore,
              userId: user?.id,
              userName: displayName || '玩家',
              details: { maxTile, targetGoal },
            });
            const hs = storage.getUserHighScore('game2048', user?.id);
            setHighScore(hs);
          }
          if (user && newScore > 0) {
            db.saveScore(user.id, user.email || '', displayName || '玩家', 'game2048', newScore);
          }
        }
      }
    },
    [board, gameOver, score, highScore, won, targetGoal, user, displayName]
  );

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (activeTab !== 'train') return;
      if (['ArrowUp', 'KeyW'].includes(e.code)) {
        e.preventDefault();
        move('up');
      } else if (['ArrowDown', 'KeyS'].includes(e.code)) {
        e.preventDefault();
        move('down');
      } else if (['ArrowLeft', 'KeyA'].includes(e.code)) {
        e.preventDefault();
        move('left');
      } else if (['ArrowRight', 'KeyD'].includes(e.code)) {
        e.preventDefault();
        move('right');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [move, activeTab]);

  // Touch Swipe Controls
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartRef.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
    };
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStartRef.current) return;
    const dx = e.changedTouches[0].clientX - touchStartRef.current.x;
    const dy = e.changedTouches[0].clientY - touchStartRef.current.y;
    touchStartRef.current = null;

    if (Math.abs(dx) > Math.abs(dy)) {
      if (dx > 30) move('right');
      else if (dx < -30) move('left');
    } else {
      if (dy > 30) move('down');
      else if (dy < -30) move('up');
    }
  };

  const history = storage.getGameHistory('game2048', user?.id, 'desc');

  return (
    <div className="flex flex-col items-center w-full max-w-4xl mx-auto py-2 px-3 sm:px-4 space-y-4">
      {/* 2048 Tab Navigation Bar (頁籤樣式，同一排最左至最右) */}
      <div className="w-full flex items-center justify-between border-b border-slate-800/80 pb-3 gap-2 flex-nowrap overflow-x-auto">
        {/* Left: Tab options */}
        <div className="flex items-center gap-1 sm:gap-1.5 p-1 bg-slate-900/90 rounded-2xl border border-slate-800 flex-shrink-0">
          <button
            onClick={() => setActiveTab('train')}
            className={`flex items-center gap-1.5 px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              activeTab === 'train'
                ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-md shadow-amber-500/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>訓練</span>
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`flex items-center gap-1.5 px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
              activeTab === 'settings'
                ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-md shadow-amber-500/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Sliders className="w-4 h-4 text-amber-400" />
            <span>設定</span>
          </button>

          <button
            onClick={() => setActiveTab('analytics')}
            className={`flex items-center gap-1.5 px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
              activeTab === 'analytics'
                ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-md shadow-amber-500/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <TrendingUp className="w-4 h-4 text-emerald-400" />
            <span>趨勢</span>
          </button>

          <button
            onClick={() => setActiveTab('tutorial')}
            className={`flex items-center gap-1.5 px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
              activeTab === 'tutorial'
                ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-md shadow-amber-500/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <HelpCircle className="w-4 h-4 text-cyan-400" />
            <span>教學</span>
          </button>
        </div>

        {/* Right: Sound toggle and test (同一排最右邊) */}
        <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
          <button
            onClick={handleToggleSound}
            className={`flex items-center gap-1 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl border text-xs sm:text-sm font-semibold transition ${
              soundEnabled
                ? 'bg-slate-800/80 hover:bg-slate-750 border-slate-700/60 text-slate-300 hover:text-white'
                : 'bg-rose-950/60 border-rose-800/80 text-rose-300 hover:text-rose-100'
            }`}
            title={soundEnabled ? '喇叭已開啟 (點擊靜音)' : '喇叭已靜音 (點擊開啟)'}
          >
            {soundEnabled ? (
              <Volume2 className="w-4 h-4 text-amber-400" />
            ) : (
              <VolumeX className="w-4 h-4 text-rose-400" />
            )}
            <span>喇叭</span>
          </button>

          <button
            onClick={handleTestSound}
            className={`flex items-center gap-1 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl border text-xs sm:text-sm font-semibold transition active:scale-95 whitespace-nowrap ${
              isTestingSound
                ? 'bg-cyan-500 text-white border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.6)] animate-pulse'
                : 'bg-amber-500/20 hover:bg-amber-500/35 border-amber-500/40 text-amber-200 hover:text-white shadow-sm'
            }`}
            title="點擊測試音效與語音"
          >
            <Volume2 className={`w-3.5 h-3.5 text-cyan-400 ${isTestingSound ? 'animate-bounce' : ''}`} />
            <span>{isTestingSound ? '測試中' : '測試'}</span>
          </button>
        </div>
      </div>

      {/* Tab 1: 訓練 (2048 Game Board Arena) */}
      {activeTab === 'train' && (
        <div className="w-full max-w-lg flex flex-col items-center space-y-4">
          {soundNotice && (
            <div className="w-full p-3 rounded-2xl bg-amber-950/80 border border-amber-500/50 text-amber-200 text-xs sm:text-sm flex items-center justify-between shadow-lg animate-fadeIn">
              <div className="flex items-center gap-2">
                <div className="p-1 rounded-lg bg-amber-500/20 text-amber-400 flex-shrink-0 animate-pulse">
                  <Volume2 className="w-4 h-4" />
                </div>
                <span>{soundNotice}</span>
              </div>
              <button
                onClick={() => setSoundNotice(null)}
                className="text-slate-400 hover:text-white text-xs px-2 py-1 rounded bg-slate-800/60 border border-slate-700 ml-2 flex-shrink-0"
              >
                知道了
              </button>
            </div>
          )}

          {/* Stats summary chip */}
          <div className="flex items-center gap-2.5 sm:gap-4 text-xs sm:text-sm text-slate-300 font-medium">
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800/60 border border-slate-700">
              <Trophy className="w-3.5 h-3.5 text-amber-400" />
              <span>最高分：<strong className="text-amber-400">{highScore}</strong></span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800/60 border border-slate-700">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>當前得分：<strong className="text-white">{score}</strong></span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800/60 border border-slate-700">
              <span className="text-slate-400">目標：</span>
              <strong className="text-amber-300 font-bold">{targetGoal}</strong>
            </div>
          </div>

          {/* Grid Board */}
          <div
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            className="relative grid grid-cols-4 gap-2.5 p-3.5 bg-slate-900 rounded-2xl border border-slate-800 shadow-2xl touch-none w-72 h-72 sm:w-80 sm:h-80 md:w-96 md:h-96"
          >
            {board.map((row, r) =>
              row.map((val, c) => {
                const style = val > 0 ? TILE_COLORS[val] || { bg: 'bg-purple-600', text: 'text-white' } : null;

                return (
                  <div
                    key={`${r}-${c}`}
                    className={`flex items-center justify-center rounded-xl font-black text-xl sm:text-2xl transition-all duration-100 select-none ${
                      val > 0
                        ? `${style?.bg} ${style?.text} shadow-md scale-100 animate-bounce-subtle`
                        : 'bg-slate-800/40'
                    }`}
                  >
                    {val > 0 ? val : ''}
                  </div>
                );
              })
            )}

            {/* Game Over / Win Overlay */}
            {gameOver && (
              <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm rounded-2xl flex flex-col items-center justify-center gap-4 animate-fadeIn">
                <h3 className="text-2xl font-black text-white">遊戲結束！</h3>
                <p className="text-sm text-slate-400">總得分：{score}</p>
                <button
                  onClick={initGame}
                  className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-sm shadow-lg transition"
                >
                  重新開始
                </button>
              </div>
            )}
          </div>

          {/* Action button */}
          <div className="flex items-center justify-between w-full max-w-sm sm:max-w-md pt-1">
            <span className="text-xs text-slate-400">支援鍵盤方向鍵 (↑↓←→) 或滑動</span>
            <button
              onClick={initGame}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-750 border border-slate-700 text-slate-200 text-xs font-semibold transition active:scale-95"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              重新開局
            </button>
          </div>
        </div>
      )}

      {/* Tab 2: 設定 (Settings Panel) */}
      {activeTab === 'settings' && (
        <div className="w-full max-w-xl glass-panel rounded-2xl p-5 sm:p-6 space-y-5 animate-fadeIn">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2 font-bold text-white text-base sm:text-lg">
              <Sliders className="w-5 h-5 text-amber-400" />
              <span>2048 挑戰設定</span>
            </div>
            <button
              onClick={() => setActiveTab('train')}
              className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white text-xs sm:text-sm font-semibold transition shadow-sm"
            >
              保存並開始訓練
            </button>
          </div>

          {/* Target Goal */}
          <div className="space-y-2">
            <label className="text-xs sm:text-sm font-semibold text-slate-300">目標合併方塊 (勝利條件)</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { val: 1024, label: '1024', desc: '休閒快節奏' },
                { val: 2048, label: '2048', desc: '經典傳奇目標' },
                { val: 4096, label: '4096', desc: '極限大師挑戰' },
              ].map(item => (
                <button
                  key={item.val}
                  onClick={() => setTargetGoal(item.val)}
                  className={`p-3 rounded-xl border text-center transition flex flex-col items-center gap-1 ${
                    targetGoal === item.val
                      ? 'bg-amber-500/25 border-amber-400 text-amber-200 shadow-sm'
                      : 'bg-slate-800/40 border-slate-700/60 text-slate-400 hover:bg-slate-800'
                  }`}
                >
                  <span className="font-bold text-xs sm:text-sm">{item.label}</span>
                  <span className="text-[10px] text-slate-400">{item.desc}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/60 flex items-center justify-between">
            <div>
              <div className="text-xs sm:text-sm font-semibold text-slate-200">重設當前盤面</div>
              <div className="text-[11px] text-slate-400">清空目前方塊並生成全新初始開局</div>
            </div>
            <button
              onClick={() => {
                initGame();
                setActiveTab('train');
              }}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-600 text-xs font-semibold text-slate-200 transition"
            >
              立即重設
            </button>
          </div>
        </div>
      )}

      {/* Tab 3: 趨勢 (Analytics Panel) */}
      {activeTab === 'analytics' && (
        <div className="w-full max-w-2xl glass-panel rounded-2xl p-5 sm:p-6 space-y-5 animate-fadeIn">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2 font-bold text-white text-base sm:text-lg">
              <TrendingUp className="w-5 h-5 text-emerald-400" />
              <span>2048 趨勢與歷史</span>
            </div>
            <button
              onClick={() => setActiveTab('train')}
              className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white text-xs sm:text-sm font-semibold transition shadow-sm"
            >
              返回訓練
            </button>
          </div>

          {/* Trend Chart */}
          <div className="w-full bg-slate-900/60 border border-slate-800 rounded-xl p-3 sm:p-4">
            <h3 className="text-xs font-semibold text-slate-400 mb-2">近期分數成長趨勢</h3>
            <ScoreTrendChart
              data={storage.getGameHistory('game2048', user?.id)}
              color="#10b981"
              gradientId="game2048TrendGradient"
              unit="分"
            />
          </div>

          {/* History list */}
          <div className="space-y-2">
            <h3 className="text-xs font-semibold text-slate-400">近期對局記錄</h3>
            <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
              {history.length === 0 ? (
                <div className="text-center py-6 text-slate-500 text-xs sm:text-sm">
                  目前（{displayName || '當前玩家'}）尚無對局記錄，點擊「訓練」開始第一次挑戰吧！
                </div>
              ) : (
                history.slice(0, 10).map((item, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-slate-850/60 border border-slate-800/80 flex items-center justify-between text-xs sm:text-sm"
                  >
                    <div>
                      <div className="font-bold text-white flex items-center gap-2">
                        <span>2048 對局</span>
                        {item.details?.maxTile ? (
                          <span className="text-[11px] font-bold text-amber-400 px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/20">
                            最高方塊：{item.details.maxTile}
                          </span>
                        ) : null}
                      </div>
                      <div className="text-[11px] text-slate-500">{item.date}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-extrabold text-emerald-400">{item.score} 分</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: 教學 (Tutorial Panel) */}
      {activeTab === 'tutorial' && (
        <div className="w-full max-w-xl glass-panel rounded-2xl p-5 sm:p-6 space-y-5 animate-fadeIn">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2 font-bold text-white text-base sm:text-lg">
              <HelpCircle className="w-5 h-5 text-cyan-400" />
              <span>2048 玩法與通關攻略</span>
            </div>
            <button
              onClick={() => setActiveTab('train')}
              className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white text-xs sm:text-sm font-semibold transition shadow-sm"
            >
              馬上開始訓練
            </button>
          </div>

          <div className="space-y-4 text-xs sm:text-sm text-slate-300 leading-relaxed">
            <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30">
              <h4 className="font-bold text-amber-300 text-sm mb-1 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-amber-400" /> 基礎規則
              </h4>
              <p className="text-slate-300">
                滑動或使用方向鍵，每次移動會使所有方塊向該方向滑動，相同數字相撞時會合體相加（2+2=4、4+4=8...），每次滑動後會在空格處隨機生成 2 或 4。
              </p>
            </div>

            <div className="space-y-2">
              <h4 className="font-bold text-white text-sm">👑 冠軍級四大黃金法則</h4>
              <ul className="list-disc list-inside space-y-1.5 text-slate-400">
                <li><strong className="text-white">角落地帶定錨法：</strong>將全場最大的數字永遠鎖定在一個固定角落（推薦左下角或右下角）。</li>
                <li><strong className="text-white">單向蛇形降序排列：</strong>最大數字身邊排次大數字，形成「降序排列線」，合併時如同骨牌一氣呵成！</li>
                <li><strong className="text-white">切忌反向滑動：</strong>例如最大數字固定在底部時，非萬不得已<strong className="text-rose-400">絕對不向上滑</strong>，避免破壞角落結構。</li>
              </ul>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/60 flex items-start gap-2.5">
              <AlertTriangle className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
              <div>
                <div className="font-bold text-white text-xs sm:text-sm">空間維持技巧</div>
                <div className="text-slate-400 text-xs mt-1">
                  保持盤面始終有 3~5 個以上空格，不要隨意合併分散的小數字，優先將邊界列填滿防止被亂入的 2 卡住角落。
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
