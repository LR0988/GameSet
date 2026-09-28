import React, { useState, useEffect, useCallback, useRef } from 'react';
import { sound } from '../../utils/sound';
import { storage } from '../../utils/storage';
import { Trophy, RotateCcw, TrendingUp } from 'lucide-react';
import confetti from 'canvas-confetti';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../utils/supabase';
import { AnalyticsModal } from '../../components/analytics/AnalyticsModal';
import { GameHistoryScoreSelector } from '../../components/common/GameHistoryScoreSelector';

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
};

export const Game2048: React.FC = () => {
  const { user, displayName } = useAuth();
  const [board, setBoard] = useState<Grid>([
    [0, 0, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
  ]);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(storage.getHighScore('2048'));
  const [gameOver, setGameOver] = useState(false);
  const [won, setWon] = useState(false);
  const [isAnalyticsOpen, setIsAnalyticsOpen] = useState(false);

  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

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

  const move = useCallback((direction: 'up' | 'down' | 'left' | 'right') => {
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
        storage.saveHighScore('2048', newScore);
      }

      // Check win 2048
      let has2048 = false;
      for (let r = 0; r < 4; r++) {
        for (let c = 0; c < 4; c++) {
          if (updatedGrid[r][c] >= 2048) has2048 = true;
        }
      }
      if (has2048 && !won) {
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
            details: { maxTile },
          });
        }
        if (user && newScore > 0) {
          db.saveScore(user.id, user.email || '', displayName || '玩家', 'game2048', newScore);
        }
      }
    }
  }, [board, gameOver, score, highScore, won, user, displayName]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
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
  }, [move]);

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

  return (
    <div className="flex flex-col items-center w-full max-w-lg mx-auto py-2 px-4 space-y-5">
      {/* Historical Score Selector Above Game */}
      <GameHistoryScoreSelector gameId="game2048" currentScore={score} />

      {/* Top Header */}
      <div className="w-full flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl glass-panel">
        <div>
          <h2 className="text-2xl font-black text-amber-400">2048</h2>
          <p className="text-xs text-slate-400">使用方向鍵或滑動合併相同數字</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsAnalyticsOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 border border-slate-700 text-xs font-semibold text-slate-300 hover:text-white transition"
          >
            <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
            <span>趨勢分析</span>
          </button>

          <div className="p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-center min-w-[65px]">
            <div className="text-[10px] uppercase text-slate-400 font-bold">分數</div>
            <div className="text-lg font-black text-white">{score}</div>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-center min-w-[65px]">
            <div className="text-[10px] uppercase text-slate-400 font-bold">最佳</div>
            <div className="text-lg font-black text-amber-400">{highScore}</div>
          </div>
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
            const style = val > 0 ? (TILE_COLORS[val] || { bg: 'bg-purple-600', text: 'text-white' }) : null;

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

        {/* Game Over Overlay */}
        {gameOver && (
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm rounded-2xl flex flex-col items-center justify-center gap-4 animate-fadeIn">
            <h3 className="text-2xl font-black text-white">遊戲結束！</h3>
            <p className="text-sm text-slate-400">總得分：{score}</p>
            <button
              onClick={initGame}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-lg transition"
            >
              重新開始
            </button>
          </div>
        )}
      </div>

      {/* Action button */}
      <div className="flex items-center justify-between w-full">
        <span className="text-xs text-slate-400">支援鍵盤方向鍵 (↑↓←→) 或手機滑動</span>
        <button
          onClick={initGame}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 border border-slate-700 text-slate-200 text-xs font-semibold transition"
        >
          <RotateCcw className="w-4 h-4" />
          重置開局
        </button>
      </div>

      <AnalyticsModal
        isOpen={isAnalyticsOpen}
        onClose={() => setIsAnalyticsOpen(false)}
        initialGameId="game2048"
      />
    </div>
  );
};
