import React, { useState, useEffect, useRef } from 'react';
import { sound } from '../../utils/sound';
import { storage } from '../../utils/storage';
import { Sparkles, Trophy, Play, RotateCcw, Zap } from 'lucide-react';
import confetti from 'canvas-confetti';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../utils/supabase';

interface ColorItem {
  name: string;
  colorHex: string;
}

const COLORS: ColorItem[] = [
  { name: '紅色', colorHex: '#ef4444' },
  { name: '綠色', colorHex: '#22c55e' },
  { name: '藍色', colorHex: '#3b82f6' },
  { name: '黃色', colorHex: '#eab308' },
  { name: '紫色', colorHex: '#a855f7' },
];

export const StroopGame: React.FC = () => {
  const { user, displayName } = useAuth();
  const [isPlaying, setIsPlaying] = useState(false);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [currentWord, setCurrentWord] = useState<ColorItem>(COLORS[0]);
  const [currentInk, setCurrentInk] = useState<ColorItem>(COLORS[1]);
  const [highScore, setHighScore] = useState(storage.getHighScore('stroop'));
  const [streak, setStreak] = useState(0);
  const [isGameOver, setIsGameOver] = useState(false);

  const timerRef = useRef<number | null>(null);

  const nextQuestion = () => {
    const wordIdx = Math.floor(Math.random() * COLORS.length);
    let inkIdx = Math.floor(Math.random() * COLORS.length);
    // 50% chance congruent, 50% incongruent
    if (Math.random() < 0.5) {
      inkIdx = wordIdx;
    }
    setCurrentWord(COLORS[wordIdx]);
    setCurrentInk(COLORS[inkIdx]);
  };

  const startGame = () => {
    setIsPlaying(true);
    setIsGameOver(false);
    setScore(0);
    setStreak(0);
    setTimeLeft(30);
    nextQuestion();
    sound.playClick();

    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = window.setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          endGame();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const endGame = () => {
    setIsPlaying(false);
    setIsGameOver(true);
    sound.playGameOver();
  };

  const handleChoice = (colorHex: string) => {
    if (!isPlaying) return;

    // The correct answer is the INK COLOR, not the word text!
    if (colorHex === currentInk.colorHex) {
      sound.playCorrect();
      setScore(s => s + 10 + streak * 2);
      setStreak(st => st + 1);
      nextQuestion();
    } else {
      sound.playWrong();
      setStreak(0);
      nextQuestion();
    }
  };

  useEffect(() => {
    if (isGameOver) {
      storage.saveHighScore('stroop', score);
      const hs = storage.getHighScore('stroop');
      setHighScore(hs);
      if (score >= hs && score > 0) {
        confetti({ particleCount: 80, spread: 60 });
      }
      if (user && score > 0) {
        db.saveScore(user.id, user.email || '', displayName || '玩家', 'stroop', score);
      }
    }
  }, [isGameOver, score, user, displayName]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  return (
    <div className="flex flex-col items-center w-full max-w-2xl mx-auto py-2 px-4 space-y-6">
      {/* Header */}
      <div className="w-full flex items-center justify-between p-4 rounded-2xl glass-panel">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-tr from-amber-500 to-rose-500 text-white shadow-md">
            <Zap className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">斯特魯普大腦抗干擾測驗 (Stroop Effect)</h2>
            <p className="text-xs text-slate-400">大腦反射速度測試：根據文字「顯示的顏色」進行點擊，忽視文字含義！</p>
          </div>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-xs">
          <Trophy className="w-4 h-4 text-amber-400" />
          <span>最高分：<strong className="text-amber-400">{highScore}</strong></span>
        </div>
      </div>

      {/* Main Game Card */}
      <div className="w-full flex flex-col items-center p-8 rounded-2xl glass-panel border border-slate-700/60 shadow-xl space-y-6 min-h-[360px] justify-center">
        {!isPlaying && !isGameOver ? (
          <div className="text-center space-y-4">
            <h3 className="text-2xl font-bold text-white">挑戰您的大腦抗干擾能力！</h3>
            <p className="text-sm text-slate-300 max-w-md mx-auto">
              規則非常簡單：畫面上會出現帶有顏色的中文字。<strong>請忽略文字的字面意思，只看該字的「文字顏色」！</strong>
            </p>
            <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700 text-sm">
              例：如果出現文字「<span className="font-extrabold text-blue-500">紅色</span>」，此時應該點選「<span className="text-blue-400 font-bold">藍色</span>」按鈕！
            </div>
            <button
              onClick={startGame}
              className="flex items-center justify-center gap-2 px-8 py-3.5 mx-auto rounded-xl bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-600 hover:to-rose-600 text-white font-bold text-base shadow-lg shadow-amber-500/25 transition active:scale-95"
            >
              <Play className="w-5 h-5 fill-current" />
              開始 30 秒挑戰
            </button>
          </div>
        ) : isGameOver ? (
          <div className="text-center space-y-4 animate-bounce-subtle">
            <h3 className="text-2xl font-black text-white">時間到！挑戰結算</h3>
            <div className="flex justify-center gap-6 py-2">
              <div className="p-4 rounded-xl bg-slate-800 border border-slate-700 min-w-[120px]">
                <div className="text-xs text-slate-400">最終得分</div>
                <div className="text-3xl font-black text-amber-400 mt-1">{score}</div>
              </div>
            </div>
            <button
              onClick={startGame}
              className="flex items-center justify-center gap-2 px-8 py-3.5 mx-auto rounded-xl bg-gradient-to-r from-indigo-500 to-cyan-500 hover:from-indigo-600 hover:to-cyan-600 text-white font-bold text-base shadow-lg transition active:scale-95"
            >
              <RotateCcw className="w-5 h-5" />
              再玩一次
            </button>
          </div>
        ) : (
          <div className="w-full flex flex-col items-center space-y-6">
            {/* HUD Status */}
            <div className="w-full flex justify-between items-center text-sm font-semibold">
              <div className="flex items-center gap-2 text-amber-400">
                <span>分數：{score}</span>
                {streak > 2 && (
                  <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-xs border border-amber-500/30">
                    連擊 x{streak} 🔥
                  </span>
                )}
              </div>
              <div className="px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-slate-200">
                剩餘時間：<span className="text-rose-400 font-bold">{timeLeft}s</span>
              </div>
            </div>

            {/* Stimulus Word */}
            <div className="py-8">
              <span
                className="text-6xl sm:text-7xl font-black select-none tracking-widest transition-transform duration-100"
                style={{ color: currentInk.colorHex }}
              >
                {currentWord.name}
              </span>
            </div>

            {/* Choices */}
            <div className="w-full grid grid-cols-2 sm:grid-cols-5 gap-2.5">
              {COLORS.map(c => (
                <button
                  key={c.colorHex}
                  onClick={() => handleChoice(c.colorHex)}
                  className="py-3 px-2 rounded-xl bg-slate-800 hover:bg-slate-750 active:bg-slate-700 border border-slate-700 hover:border-slate-500 text-white font-bold text-sm sm:text-base transition select-none flex items-center justify-center gap-2 shadow"
                >
                  <span
                    className="w-3.5 h-3.5 rounded-full border border-white/20"
                    style={{ backgroundColor: c.colorHex }}
                  />
                  <span>{c.name}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
