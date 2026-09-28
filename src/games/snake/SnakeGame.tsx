import React, { useState, useEffect, useRef, useCallback } from 'react';
import { sound } from '../../utils/sound';
import { storage } from '../../utils/storage';
import { Trophy, Play, RotateCcw, ArrowUp, ArrowDown, ArrowLeft, ArrowRight, TrendingUp } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../utils/supabase';
import { AnalyticsModal } from '../../components/analytics/AnalyticsModal';
import { GameHistoryScoreSelector } from '../../components/common/GameHistoryScoreSelector';

type Point = { x: number; y: number };
type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';

const GRID_SIZE = 20;

export const SnakeGame: React.FC = () => {
  const { user, displayName } = useAuth();
  const [snake, setSnake] = useState<Point[]>([
    { x: 10, y: 10 },
    { x: 10, y: 11 },
    { x: 10, y: 12 },
  ]);
  const [food, setFood] = useState<Point>({ x: 5, y: 5 });
  const [direction, setDirection] = useState<Direction>('UP');
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [score, setScore] = useState<number>(0);
  const [highScore, setHighScore] = useState<number>(storage.getHighScore('snake'));
  const [isAnalyticsOpen, setIsAnalyticsOpen] = useState<boolean>(false);

  const directionRef = useRef<Direction>('UP');
  directionRef.current = direction;

  const generateFood = useCallback((currentSnake: Point[]): Point => {
    let newFood: Point;
    while (true) {
      newFood = {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE),
      };
      const onSnake = currentSnake.some(seg => seg.x === newFood.x && seg.y === newFood.y);
      if (!onSnake) break;
    }
    return newFood;
  }, []);

  const startGame = () => {
    const initialSnake: Point[] = [
      { x: 10, y: 10 },
      { x: 10, y: 11 },
      { x: 10, y: 12 },
    ];
    setSnake(initialSnake);
    setDirection('UP');
    directionRef.current = 'UP';
    setFood(generateFood(initialSnake));
    setScore(0);
    setIsGameOver(false);
    setIsPlaying(true);
    sound.playClick();
  };

  const handleGameOver = useCallback(() => {
    setIsPlaying(false);
    setIsGameOver(true);
    sound.playGameOver();
    if (score > 0) {
      storage.saveGameRecord({
        gameId: 'snake',
        score,
        details: { length: snake.length },
      });
    }
    if (user && score > 0) {
      db.saveScore(user.id, user.email || '', displayName || '玩家', 'snake', score);
    }
  }, [user, displayName, score, snake.length]);

  // Game loop
  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      setSnake(prevSnake => {
        const head = { ...prevSnake[0] };
        const dir = directionRef.current;

        if (dir === 'UP') head.y -= 1;
        else if (dir === 'DOWN') head.y += 1;
        else if (dir === 'LEFT') head.x -= 1;
        else if (dir === 'RIGHT') head.x += 1;

        // Collision with walls
        if (head.x < 0 || head.x >= GRID_SIZE || head.y < 0 || head.y >= GRID_SIZE) {
          handleGameOver();
          return prevSnake;
        }

        // Collision with self
        if (prevSnake.some(seg => seg.x === head.x && seg.y === head.y)) {
          handleGameOver();
          return prevSnake;
        }

        const newSnake = [head, ...prevSnake];

        // Eat food
        if (head.x === food.x && head.y === food.y) {
          sound.playCorrect();
          setScore(s => {
            const nextScore = s + 10;
            if (nextScore > highScore) {
              setHighScore(nextScore);
              storage.saveHighScore('snake', nextScore);
            }
            return nextScore;
          });
          setFood(generateFood(newSnake));
        } else {
          newSnake.pop();
        }

        return newSnake;
      });
    }, 120);

    return () => clearInterval(interval);
  }, [isPlaying, food, highScore, generateFood, handleGameOver]);

  const changeDirection = useCallback((newDir: Direction) => {
    const cur = directionRef.current;
    if (newDir === 'UP' && cur !== 'DOWN') setDirection('UP');
    if (newDir === 'DOWN' && cur !== 'UP') setDirection('DOWN');
    if (newDir === 'LEFT' && cur !== 'RIGHT') setDirection('LEFT');
    if (newDir === 'RIGHT' && cur !== 'LEFT') setDirection('RIGHT');
  }, []);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['ArrowUp', 'KeyW'].includes(e.code)) {
        e.preventDefault();
        changeDirection('UP');
      } else if (['ArrowDown', 'KeyS'].includes(e.code)) {
        e.preventDefault();
        changeDirection('DOWN');
      } else if (['ArrowLeft', 'KeyA'].includes(e.code)) {
        e.preventDefault();
        changeDirection('LEFT');
      } else if (['ArrowRight', 'KeyD'].includes(e.code)) {
        e.preventDefault();
        changeDirection('RIGHT');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [changeDirection]);

  return (
    <div className="flex flex-col items-center w-full max-w-lg mx-auto py-2 px-4 space-y-4">
      {/* Historical Score Selector Above Game */}
      <GameHistoryScoreSelector gameId="snake" currentScore={score} />

      {/* Top Bar */}
      <div className="w-full flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl glass-panel">
        <div>
          <h2 className="text-xl font-black text-emerald-400">復古經典貪食蛇 (Snake)</h2>
          <p className="text-xs text-slate-400">使用方向鍵或虛擬手把操控蛇吃蘋果</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsAnalyticsOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 border border-slate-700 text-xs font-semibold text-slate-300 hover:text-white transition"
          >
            <TrendingUp className="w-3.5 h-3.5 text-cyan-400" />
            <span>趨勢分析</span>
          </button>

          <div className="p-2 rounded-xl bg-slate-800 border border-slate-700 text-center min-w-[55px]">
            <div className="text-[10px] uppercase text-slate-400 font-bold">分數</div>
            <div className="text-base font-black text-white">{score}</div>
          </div>
          <div className="p-2 rounded-xl bg-slate-800 border border-slate-700 text-center min-w-[55px]">
            <div className="text-[10px] uppercase text-slate-400 font-bold">最佳</div>
            <div className="text-base font-black text-emerald-400">{highScore}</div>
          </div>
        </div>
      </div>

      {/* Grid Canvas */}
      <div className="relative w-72 h-72 sm:w-80 sm:h-80 md:w-96 md:h-96 bg-slate-950 rounded-2xl border-2 border-emerald-900/60 shadow-2xl overflow-hidden">
        {/* Snake & Food rendering */}
        {snake.map((seg, idx) => (
          <div
            key={idx}
            className={`absolute rounded-sm ${
              idx === 0
                ? 'bg-emerald-400 z-10 shadow-[0_0_8px_rgba(52,211,153,0.8)]'
                : 'bg-emerald-600'
            }`}
            style={{
              left: `${(seg.x / GRID_SIZE) * 100}%`,
              top: `${(seg.y / GRID_SIZE) * 100}%`,
              width: `${100 / GRID_SIZE}%`,
              height: `${100 / GRID_SIZE}%`,
            }}
          />
        ))}

        {/* Food */}
        <div
          className="absolute rounded-full bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.9)] animate-pulse"
          style={{
            left: `${(food.x / GRID_SIZE) * 100}%`,
            top: `${(food.y / GRID_SIZE) * 100}%`,
            width: `${100 / GRID_SIZE}%`,
            height: `${100 / GRID_SIZE}%`,
          }}
        />

        {/* Start / Game Over overlay */}
        {!isPlaying && (
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm flex flex-col items-center justify-center gap-3 p-4 z-20">
            <h3 className="text-2xl font-black text-white">
              {isGameOver ? '遊戲結束！' : '準備開始'}
            </h3>
            {isGameOver && <p className="text-sm text-slate-300">總得分：{score}</p>}
            <button
              onClick={startGame}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-lg transition active:scale-95"
            >
              {isGameOver ? <RotateCcw className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current" />}
              {isGameOver ? '再玩一次' : '開始遊戲'}
            </button>
          </div>
        )}
      </div>

      {/* On-screen D-pad for mobile users */}
      <div className="flex flex-col items-center gap-1 sm:hidden pt-2">
        <button
          onClick={() => changeDirection('UP')}
          className="p-3 rounded-xl bg-slate-800 border border-slate-700 text-slate-200 active:bg-slate-700 shadow"
        >
          <ArrowUp className="w-5 h-5" />
        </button>
        <div className="flex gap-4">
          <button
            onClick={() => changeDirection('LEFT')}
            className="p-3 rounded-xl bg-slate-800 border border-slate-700 text-slate-200 active:bg-slate-700 shadow"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <button
            onClick={() => changeDirection('DOWN')}
            className="p-3 rounded-xl bg-slate-800 border border-slate-700 text-slate-200 active:bg-slate-700 shadow"
          >
            <ArrowDown className="w-5 h-5" />
          </button>
          <button
            onClick={() => changeDirection('RIGHT')}
            className="p-3 rounded-xl bg-slate-800 border border-slate-700 text-slate-200 active:bg-slate-700 shadow"
          >
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      <AnalyticsModal
        isOpen={isAnalyticsOpen}
        onClose={() => setIsAnalyticsOpen(false)}
        initialGameId="snake"
      />
    </div>
  );
};
