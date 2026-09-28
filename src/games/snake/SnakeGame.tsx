import React, { useState, useEffect, useRef, useCallback } from 'react';
import { sound } from '../../utils/sound';
import { storage } from '../../utils/storage';
import { Trophy, Play, RotateCcw, ArrowUp, ArrowDown, ArrowLeft, ArrowRight, TrendingUp, Sliders, HelpCircle, Volume2, VolumeX, Sparkles, CheckCircle2, AlertTriangle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../utils/supabase';
import { ScoreTrendChart } from '../../components/analytics/ScoreTrendChart';

type Point = { x: number; y: number };
type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';

const GRID_SIZE = 20;

export const SnakeGame: React.FC = () => {
  const { user, displayName } = useAuth();
  const [activeTab, setActiveTab] = useState<'train' | 'settings' | 'analytics' | 'tutorial'>('train');

  // Sound & Test State
  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => !sound.getMuted());
  const [isTestingSound, setIsTestingSound] = useState<boolean>(false);
  const [soundNotice, setSoundNotice] = useState<string | null>(null);

  // Settings
  const [speedMs, setSpeedMs] = useState<number>(120); // 160ms easy, 120ms standard, 80ms fast
  const [wrapBorders, setWrapBorders] = useState<boolean>(false);

  // Gameplay State
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
  const [highScore, setHighScore] = useState<number>(0);

  useEffect(() => {
    setHighScore(storage.getUserHighScore('snake', user?.id));
  }, [user]);

  const directionRef = useRef<Direction>('UP');
  directionRef.current = direction;

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
        userId: user?.id,
        userName: displayName || '玩家',
        details: { length: snake.length, speedMs, wrapBorders },
      });
      const hs = storage.getUserHighScore('snake', user?.id);
      setHighScore(hs);
    }
    if (user && score > 0) {
      db.saveScore(user.id, user.email || '', displayName || '玩家', 'snake', score);
    }
  }, [user, displayName, score, snake.length, speedMs, wrapBorders]);

  // Game loop
  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      setSnake(prevSnake => {
        let head = { ...prevSnake[0] };
        const dir = directionRef.current;

        if (dir === 'UP') head.y -= 1;
        else if (dir === 'DOWN') head.y += 1;
        else if (dir === 'LEFT') head.x -= 1;
        else if (dir === 'RIGHT') head.x += 1;

        // Collision with walls or wrap borders
        if (head.x < 0 || head.x >= GRID_SIZE || head.y < 0 || head.y >= GRID_SIZE) {
          if (wrapBorders) {
            if (head.x < 0) head.x = GRID_SIZE - 1;
            else if (head.x >= GRID_SIZE) head.x = 0;
            if (head.y < 0) head.y = GRID_SIZE - 1;
            else if (head.y >= GRID_SIZE) head.y = 0;
          } else {
            handleGameOver();
            return prevSnake;
          }
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
    }, speedMs);

    return () => clearInterval(interval);
  }, [isPlaying, food, highScore, generateFood, handleGameOver, speedMs, wrapBorders]);

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
      if (activeTab !== 'train') return;
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
  }, [changeDirection, activeTab]);

  const history = storage.getGameHistory('snake', user?.id, 'desc');

  return (
    <div className="flex flex-col items-center w-full max-w-4xl mx-auto py-2 px-3 sm:px-4 space-y-4">
      {/* Snake Tab Navigation Bar (頁籤樣式，同一排最左至最右) */}
      <div className="w-full flex items-center justify-between border-b border-slate-800/80 pb-3 gap-2 flex-nowrap overflow-x-auto">
        {/* Left: Tab options */}
        <div className="flex items-center gap-1 sm:gap-1.5 p-1 bg-slate-900/90 rounded-2xl border border-slate-800 flex-shrink-0">
          <button
            onClick={() => setActiveTab('train')}
            className={`flex items-center gap-1.5 px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              activeTab === 'train'
                ? 'bg-gradient-to-r from-emerald-600 to-teal-500 text-white shadow-md shadow-emerald-600/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Play className="w-4 h-4 text-emerald-300 fill-current" />
            <span>訓練</span>
          </button>

          <button
            onClick={() => {
              if (isPlaying) setIsPlaying(false);
              setActiveTab('settings');
            }}
            className={`flex items-center gap-1.5 px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
              activeTab === 'settings'
                ? 'bg-gradient-to-r from-emerald-600 to-teal-500 text-white shadow-md shadow-emerald-600/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Sliders className="w-4 h-4 text-amber-400" />
            <span>設定</span>
          </button>

          <button
            onClick={() => {
              if (isPlaying) setIsPlaying(false);
              setActiveTab('analytics');
            }}
            className={`flex items-center gap-1.5 px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
              activeTab === 'analytics'
                ? 'bg-gradient-to-r from-emerald-600 to-teal-500 text-white shadow-md shadow-emerald-600/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <TrendingUp className="w-4 h-4 text-emerald-400" />
            <span>趨勢</span>
          </button>

          <button
            onClick={() => {
              if (isPlaying) setIsPlaying(false);
              setActiveTab('tutorial');
            }}
            className={`flex items-center gap-1.5 px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
              activeTab === 'tutorial'
                ? 'bg-gradient-to-r from-emerald-600 to-teal-500 text-white shadow-md shadow-emerald-600/30'
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
              <Volume2 className="w-4 h-4 text-emerald-400" />
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
                : 'bg-emerald-500/20 hover:bg-emerald-500/35 border-emerald-500/40 text-emerald-200 hover:text-white shadow-sm'
            }`}
            title="點擊測試音效與語音"
          >
            <Volume2 className={`w-3.5 h-3.5 text-cyan-400 ${isTestingSound ? 'animate-bounce' : ''}`} />
            <span>{isTestingSound ? '測試中' : '測試'}</span>
          </button>
        </div>
      </div>

      {/* Tab 1: 訓練 (Snake Game Arena) */}
      {activeTab === 'train' && (
        <div className="w-full max-w-lg flex flex-col items-center space-y-4">
          {soundNotice && (
            <div className="w-full p-3 rounded-2xl bg-emerald-950/80 border border-emerald-500/50 text-emerald-200 text-xs sm:text-sm flex items-center justify-between shadow-lg animate-fadeIn">
              <div className="flex items-center gap-2">
                <div className="p-1 rounded-lg bg-emerald-500/20 text-emerald-400 flex-shrink-0 animate-pulse">
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
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              <span>得分：<strong className="text-white">{score}</strong></span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800/60 border border-slate-700">
              <span className="text-slate-400">長度：</span>
              <strong className="text-emerald-400">{snake.length}</strong>
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
        </div>
      )}

      {/* Tab 2: 設定 (Settings Panel) */}
      {activeTab === 'settings' && (
        <div className="w-full max-w-xl glass-panel rounded-2xl p-5 sm:p-6 space-y-5 animate-fadeIn">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2 font-bold text-white text-base sm:text-lg">
              <Sliders className="w-5 h-5 text-amber-400" />
              <span>貪食蛇 挑戰設定</span>
            </div>
            <button
              onClick={() => setActiveTab('train')}
              className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white text-xs sm:text-sm font-semibold transition shadow-sm"
            >
              保存並開始訓練
            </button>
          </div>

          {/* Speed settings */}
          <div className="space-y-2">
            <label className="text-xs sm:text-sm font-semibold text-slate-300">移動速度 (挑戰難度)</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { speed: 160, label: '休閒慢速', desc: '節奏緩和 (160ms)' },
                { speed: 120, label: '標準節奏', desc: '經典手感 (120ms)' },
                { speed: 75, label: '極速狂飆', desc: '神級反應 (75ms)' },
              ].map(item => (
                <button
                  key={item.speed}
                  onClick={() => setSpeedMs(item.speed)}
                  className={`p-3 rounded-xl border text-center transition flex flex-col items-center gap-1 ${
                    speedMs === item.speed
                      ? 'bg-emerald-600/30 border-emerald-500 text-emerald-200 shadow-sm'
                      : 'bg-slate-800/40 border-slate-700/60 text-slate-400 hover:bg-slate-800'
                  }`}
                >
                  <span className="font-bold text-xs sm:text-sm">{item.label}</span>
                  <span className="text-[10px] text-slate-400">{item.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Border Mode */}
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-800/40 border border-slate-700/50">
            <div>
              <div className="text-xs sm:text-sm font-semibold text-slate-200">穿越邊界模式 (Wrap Borders)</div>
              <div className="text-[11px] text-slate-400">開啟後撞到牆壁不會死亡，將從對側穿出</div>
            </div>
            <input
              type="checkbox"
              checked={wrapBorders}
              onChange={e => setWrapBorders(e.target.checked)}
              className="w-5 h-5 rounded accent-emerald-500 cursor-pointer"
            />
          </div>
        </div>
      )}

      {/* Tab 3: 趨勢 (Analytics Panel) */}
      {activeTab === 'analytics' && (
        <div className="w-full max-w-2xl glass-panel rounded-2xl p-5 sm:p-6 space-y-5 animate-fadeIn">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2 font-bold text-white text-base sm:text-lg">
              <TrendingUp className="w-5 h-5 text-emerald-400" />
              <span>貪食蛇 趨勢與歷史</span>
            </div>
            <button
              onClick={() => setActiveTab('train')}
              className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white text-xs sm:text-sm font-semibold transition shadow-sm"
            >
              返回訓練
            </button>
          </div>

          {/* Trend Chart */}
          <div className="w-full bg-slate-900/60 border border-slate-800 rounded-xl p-3 sm:p-4">
            <h3 className="text-xs font-semibold text-slate-400 mb-2">近期分數成長趨勢</h3>
            <ScoreTrendChart
              data={storage.getGameHistory('snake', user?.id)}
              color="#10b981"
              gradientId="snakeTrendGradient"
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
                        <span>貪食蛇 對局</span>
                        {item.details?.length ? (
                          <span className="text-[11px] font-bold text-emerald-400 px-1.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20">
                            最終長度：{item.details.length}
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
              <span>貪食蛇 玩法與操控秘笈</span>
            </div>
            <button
              onClick={() => setActiveTab('train')}
              className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white text-xs sm:text-sm font-semibold transition shadow-sm"
            >
              馬上開始訓練
            </button>
          </div>

          <div className="space-y-4 text-xs sm:text-sm text-slate-300 leading-relaxed">
            <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
              <h4 className="font-bold text-emerald-300 text-sm mb-1 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" /> 基本規則
              </h4>
              <p className="text-slate-300">
                操控蛇頭移動吃掉畫面中的蘋果，每吃一個蘋果身體延長一節並獲得 10 分。請小心避免撞到蛇身自己的尾巴或四周牆壁（若開啟穿牆模式則可由對邊穿出）。
              </p>
            </div>

            <div className="space-y-2">
              <h4 className="font-bold text-white text-sm">操作方式</h4>
              <ul className="list-disc list-inside space-y-1.5 text-slate-400">
                <li><strong className="text-white">電腦鍵盤：</strong>支援方向鍵（↑ ↓ ← →）或 WASD。</li>
                <li><strong className="text-white">手機觸控：</strong>使用螢幕下方的虛擬十字方向按鈕。</li>
              </ul>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/60 flex items-start gap-2.5">
              <AlertTriangle className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
              <div>
                <div className="font-bold text-white text-xs sm:text-sm">長度破百的防自噬秘訣</div>
                <div className="text-slate-400 text-xs mt-1">
                  當身體變長後，不要貿然直接朝中央穿越，沿著外圍邊緣做「S 形巡航」，為自己預留寬敞的掉頭空間！
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
