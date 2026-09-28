import React, { useState, useEffect, useRef } from 'react';
import { sound } from '../../utils/sound';
import { storage } from '../../utils/storage';
import { Trophy, Play, RotateCcw, Zap, TrendingUp, Sliders, HelpCircle, Volume2, VolumeX, CheckCircle2, AlertTriangle } from 'lucide-react';
import confetti from 'canvas-confetti';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../utils/supabase';
import { ScoreTrendChart } from '../../components/analytics/ScoreTrendChart';

interface ColorItem {
  name: string;
  colorHex: string;
}

const ALL_COLORS: ColorItem[] = [
  { name: '紅色', colorHex: '#ef4444' },
  { name: '綠色', colorHex: '#22c55e' },
  { name: '藍色', colorHex: '#3b82f6' },
  { name: '黃色', colorHex: '#eab308' },
  { name: '紫色', colorHex: '#a855f7' },
];

export const StroopGame: React.FC = () => {
  const { user, displayName } = useAuth();
  const [activeTab, setActiveTab] = useState<'train' | 'settings' | 'analytics' | 'tutorial'>('train');

  // Sound & Test State
  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => !sound.getMuted());
  const [isTestingSound, setIsTestingSound] = useState<boolean>(false);
  const [soundNotice, setSoundNotice] = useState<string | null>(null);

  // Stroop Settings
  const [duration, setDuration] = useState<number>(30);
  const [conflictRate, setConflictRate] = useState<number>(0.5); // 0.3 easy, 0.5 standard, 0.8 hard
  const [colorCount, setColorCount] = useState<number>(5);

  // Gameplay State
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [score, setScore] = useState<number>(0);
  const [timeLeft, setTimeLeft] = useState<number>(30);
  const [currentWord, setCurrentWord] = useState<ColorItem>(ALL_COLORS[0]);
  const [currentInk, setCurrentInk] = useState<ColorItem>(ALL_COLORS[1]);
  const [highScore, setHighScore] = useState<number>(storage.getHighScore('stroop'));
  const [streak, setStreak] = useState<number>(0);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);

  const timerRef = useRef<number | null>(null);

  const activeColors = ALL_COLORS.slice(0, colorCount);

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
    setSoundNotice('正在播放測試音效（三連音階 + 語音）！若未聽見，請檢查音量或瀏覽器分頁設定。');

    setTimeout(() => {
      setIsTestingSound(false);
    }, 1200);

    setTimeout(() => {
      setSoundNotice(null);
    }, 5000);
  };

  const nextQuestion = () => {
    const wordIdx = Math.floor(Math.random() * activeColors.length);
    let inkIdx = Math.floor(Math.random() * activeColors.length);

    // conflictRate: chance of incongruent (word != ink)
    if (Math.random() >= conflictRate) {
      inkIdx = wordIdx;
    } else {
      while (activeColors.length > 1 && inkIdx === wordIdx) {
        inkIdx = Math.floor(Math.random() * activeColors.length);
      }
    }
    setCurrentWord(activeColors[wordIdx]);
    setCurrentInk(activeColors[inkIdx]);
  };

  const startGame = () => {
    setIsPlaying(true);
    setIsGameOver(false);
    setScore(0);
    setStreak(0);
    setTimeLeft(duration);
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

  const stopGame = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setIsPlaying(false);
    setIsGameOver(false);
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
      if (score > 0) {
        storage.saveGameRecord({
          gameId: 'stroop',
          score,
          details: { streak, duration },
        });
      }
      const hs = storage.getHighScore('stroop');
      setHighScore(hs);
      if (score >= hs && score > 0) {
        confetti({ particleCount: 80, spread: 60 });
      }
      if (user && score > 0) {
        db.saveScore(user.id, user.email || '', displayName || '玩家', 'stroop', score);
      }
    }
  }, [isGameOver, score, streak, user, displayName, duration]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const history = storage.getGameHistory('stroop', user?.id, 'desc');

  return (
    <div className="flex flex-col items-center w-full max-w-4xl mx-auto py-2 px-3 sm:px-4 space-y-4">
      {/* Stroop Tab Navigation Bar (頁籤樣式，同一排最左至最右) */}
      <div className="w-full flex items-center justify-between border-b border-slate-800/80 pb-3 gap-2 flex-nowrap overflow-x-auto">
        {/* Left: Tab options */}
        <div className="flex items-center gap-1 sm:gap-1.5 p-1 bg-slate-900/90 rounded-2xl border border-slate-800 flex-shrink-0">
          <button
            onClick={() => setActiveTab('train')}
            className={`flex items-center gap-1.5 px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              activeTab === 'train'
                ? 'bg-gradient-to-r from-amber-500 to-rose-500 text-white shadow-md shadow-amber-500/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Zap className="w-4 h-4 text-amber-300" />
            <span>訓練</span>
          </button>

          <button
            onClick={() => {
              if (isPlaying) stopGame();
              setActiveTab('settings');
            }}
            className={`flex items-center gap-1.5 px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
              activeTab === 'settings'
                ? 'bg-gradient-to-r from-amber-500 to-rose-500 text-white shadow-md shadow-amber-500/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Sliders className="w-4 h-4 text-amber-400" />
            <span>設定</span>
          </button>

          <button
            onClick={() => {
              if (isPlaying) stopGame();
              setActiveTab('analytics');
            }}
            className={`flex items-center gap-1.5 px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
              activeTab === 'analytics'
                ? 'bg-gradient-to-r from-amber-500 to-rose-500 text-white shadow-md shadow-amber-500/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <TrendingUp className="w-4 h-4 text-rose-400" />
            <span>趨勢</span>
          </button>

          <button
            onClick={() => {
              if (isPlaying) stopGame();
              setActiveTab('tutorial');
            }}
            className={`flex items-center gap-1.5 px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
              activeTab === 'tutorial'
                ? 'bg-gradient-to-r from-amber-500 to-rose-500 text-white shadow-md shadow-amber-500/30'
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

      {/* Tab 1: 訓練 (Game Arena) */}
      {activeTab === 'train' && (
        <div className="w-full max-w-2xl flex flex-col items-center space-y-4">
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
          <div className="flex items-center gap-3 sm:gap-4 text-xs sm:text-sm text-slate-300 font-medium">
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800/60 border border-slate-700">
              <Trophy className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400" />
              <span>最高分：<strong className="text-amber-400">{highScore}</strong></span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800/60 border border-slate-700">
              <Zap className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-rose-400" />
              <span>限時：<strong className="text-rose-400">{duration}秒</strong></span>
            </div>
          </div>

          {/* Main Game Card */}
          <div className="w-full flex flex-col items-center p-6 sm:p-8 rounded-2xl glass-panel border border-slate-700/60 shadow-xl space-y-6 min-h-[360px] justify-center">
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
                  開始 {duration} 秒挑戰
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
                  className="flex items-center justify-center gap-2 px-8 py-3.5 mx-auto rounded-xl bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-600 hover:to-rose-600 text-white font-bold text-base shadow-lg transition active:scale-95"
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
                  {activeColors.map(c => (
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
      )}

      {/* Tab 2: 設定 (Settings Panel) */}
      {activeTab === 'settings' && (
        <div className="w-full max-w-xl glass-panel rounded-2xl p-5 sm:p-6 space-y-5 animate-fadeIn">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2 font-bold text-white text-base sm:text-lg">
              <Sliders className="w-5 h-5 text-amber-400" />
              <span>斯特魯普測驗設定</span>
            </div>
            <button
              onClick={() => setActiveTab('train')}
              className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-600 hover:to-rose-600 text-white text-xs sm:text-sm font-semibold transition shadow-sm"
            >
              保存並開始訓練
            </button>
          </div>

          {/* Time Duration */}
          <div className="space-y-2">
            <label className="text-xs sm:text-sm font-semibold text-slate-300">挑戰限時 (秒數)</label>
            <div className="grid grid-cols-4 gap-2">
              {[20, 30, 45, 60].map(s => (
                <button
                  key={s}
                  onClick={() => setDuration(s)}
                  className={`py-2 rounded-xl text-xs sm:text-sm font-bold border transition ${
                    duration === s
                      ? 'bg-amber-500 text-white border-amber-400 shadow-md shadow-amber-500/20'
                      : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-750'
                  }`}
                >
                  {s} 秒
                </button>
              ))}
            </div>
          </div>

          {/* Interference Conflict Rate */}
          <div className="space-y-2">
            <label className="text-xs sm:text-sm font-semibold text-slate-300">干擾難度模式</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { rate: 0.3, label: '初階練習', desc: '30% 干擾' },
                { rate: 0.5, label: '標準難度', desc: '50% 干擾' },
                { rate: 0.85, label: '極限抗干擾', desc: '85% 干擾' },
              ].map(item => (
                <button
                  key={item.rate}
                  onClick={() => setConflictRate(item.rate)}
                  className={`p-3 rounded-xl border text-center transition flex flex-col items-center gap-1 ${
                    conflictRate === item.rate
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

          {/* Color Pool Size */}
          <div className="space-y-2">
            <label className="text-xs sm:text-sm font-semibold text-slate-300">顏色按鈕數量</label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { count: 4, label: '4 種顏色', desc: '紅、綠、藍、黃' },
                { count: 5, label: '5 種顏色 (標準)', desc: '紅、綠、藍、黃、紫' },
              ].map(item => (
                <button
                  key={item.count}
                  onClick={() => setColorCount(item.count)}
                  className={`p-3 rounded-xl border text-center transition flex flex-col items-center gap-1 ${
                    colorCount === item.count
                      ? 'bg-rose-500/25 border-rose-400 text-rose-200 shadow-sm'
                      : 'bg-slate-800/40 border-slate-700/60 text-slate-400 hover:bg-slate-800'
                  }`}
                >
                  <span className="font-bold text-xs sm:text-sm">{item.label}</span>
                  <span className="text-[10px] text-slate-400">{item.desc}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: 趨勢 (Analytics Panel) */}
      {activeTab === 'analytics' && (
        <div className="w-full max-w-2xl glass-panel rounded-2xl p-5 sm:p-6 space-y-5 animate-fadeIn">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2 font-bold text-white text-base sm:text-lg">
              <TrendingUp className="w-5 h-5 text-amber-400" />
              <span>斯特魯普 趨勢與歷史</span>
            </div>
            <button
              onClick={() => setActiveTab('train')}
              className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-600 hover:to-rose-600 text-white text-xs sm:text-sm font-semibold transition shadow-sm"
            >
              返回訓練
            </button>
          </div>

          {/* Trend Chart */}
          <div className="w-full bg-slate-900/60 border border-slate-800 rounded-xl p-3 sm:p-4">
            <h3 className="text-xs font-semibold text-slate-400 mb-2">近期得分成長趨勢</h3>
            <ScoreTrendChart
              data={storage.getGameHistory('stroop', user?.id)}
              color="#f59e0b"
              gradientId="stroopTrendGradient"
              unit="分"
            />
          </div>

          {/* History list */}
          <div className="space-y-2">
            <h3 className="text-xs font-semibold text-slate-400">近期挑戰記錄</h3>
            <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
              {history.length === 0 ? (
                <div className="text-center py-6 text-slate-500 text-xs sm:text-sm">
                  目前尚無對局記錄，點擊「訓練」開始第一次挑戰吧！
                </div>
              ) : (
                history.slice(0, 10).map((item, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-slate-850/60 border border-slate-800/80 flex items-center justify-between text-xs sm:text-sm"
                  >
                    <div>
                      <div className="font-bold text-white flex items-center gap-2">
                        <span>斯特魯普測驗</span>
                        {item.details?.streak ? (
                          <span className="text-[11px] font-normal text-amber-400">連擊 x{item.details.streak}</span>
                        ) : null}
                      </div>
                      <div className="text-[11px] text-slate-500">{item.date}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-extrabold text-amber-400">{item.score} 分</div>
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
              <span>斯特魯普測驗 教學說明</span>
            </div>
            <button
              onClick={() => setActiveTab('train')}
              className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-600 hover:to-rose-600 text-white text-xs sm:text-sm font-semibold transition shadow-sm"
            >
              馬上開始訓練
            </button>
          </div>

          <div className="space-y-4 text-xs sm:text-sm text-slate-300 leading-relaxed">
            <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30">
              <h4 className="font-bold text-amber-300 text-sm mb-1 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-amber-400" /> 什麼是斯特魯普效應 (Stroop Effect)？
              </h4>
              <p className="text-slate-300">
                斯特魯普效應是神經心理學的經典測驗。當文字所表達的「意思」與顯示的「墨水顏色」不一致時，大腦會產生強烈干擾，反應時間會顯著延遲。
              </p>
            </div>

            <div className="space-y-2">
              <h4 className="font-bold text-white text-sm">測驗規則</h4>
              <ul className="list-disc list-inside space-y-1.5 text-slate-400">
                <li>忽視字面的中文字義，<strong className="text-white">只辨認文字顯示的物理顏色</strong>。</li>
                <li>點擊下方與顏色相對應的按鈕進行作答。</li>
                <li>連續答對將觸發連擊獎勵加分！</li>
              </ul>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/60 flex items-start gap-2.5">
              <AlertTriangle className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
              <div>
                <div className="font-bold text-white text-xs sm:text-sm">高分鍛鍊訣竅</div>
                <div className="text-slate-400 text-xs mt-1">
                  將注意力聚焦在文字的邊緣或背景輪廓，刻意抑制閱讀文字發音的反射衝動，專注於色彩感光辨別，能大幅縮短神經決策耗時！
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
