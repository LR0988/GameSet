import React, { useState, useEffect } from 'react';
import { useNBack } from './useNBack';
import { NBackGrid } from './NBackGrid';
import { NBackControls } from './NBackControls';
import { NBackStats } from './NBackStats';
import { storage } from '../../utils/storage';
import { Sliders, HelpCircle, Trophy, Sparkles, Volume2, VolumeX, TrendingUp, Brain, Zap } from 'lucide-react';
import { NBackSessionStats } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../utils/supabase';
import { sound } from '../../utils/sound';
import { ScoreTrendChart } from '../../components/analytics/ScoreTrendChart';

export const NBackGame: React.FC = () => {
  const { user, displayName } = useAuth();
  const initialSettings = storage.getNBackSettings();
  const [activeTab, setActiveTab] = useState<'train' | 'settings' | 'analytics' | 'tutorial'>('train');
  const [history, setHistory] = useState<NBackSessionStats[]>([]);
  const [highScore, setHighScore] = useState<number>(0);
  const [isTestingSound, setIsTestingSound] = useState(false);
  const [soundNotice, setSoundNotice] = useState<string | null>(null);

  const handleTestSound = () => {
    sound.unlockAudio();
    sound.setMuted(false);
    if (!settings.soundEnabled) {
      const nextSettings = { ...settings, soundEnabled: true };
      setSettings(nextSettings);
      storage.saveNBackSettings(nextSettings);
    }
    setIsTestingSound(true);
    sound.testSound();
    setSoundNotice('正在播放測試音效（三連音階 + 字母 C 語音）！若未聽見，請檢查音量或瀏覽器分頁設定。');

    setTimeout(() => {
      setIsTestingSound(false);
    }, 1200);

    setTimeout(() => {
      setSoundNotice(null);
    }, 6000);
  };

  const handleToggleSound = () => {
    const nextVal = !settings.soundEnabled;
    const nextSettings = { ...settings, soundEnabled: nextVal };
    setSettings(nextSettings);
    storage.saveNBackSettings(nextSettings);
    sound.setMuted(!nextVal);
    if (nextVal) {
      sound.unlockAudio();
      sound.playClick();
    }
  };

  const {
    settings,
    setSettings,
    isPlaying,
    currentTrialIdx,
    totalTrials,
    currentStimulus,
    showStimulus,
    currentResponse,
    sessionStats,
    feedback,
    startGame,
    stopGame,
    handlePositionMatch,
    handleAudioMatch,
  } = useNBack(initialSettings);

  useEffect(() => {
    setHighScore(storage.getHighScore('nback'));
    setHistory(storage.getNBackHistory());

    if (sessionStats && user) {
      db.saveScore(user.id, user.email || '', displayName || '玩家', 'nback', sessionStats.score, {
        nLevel: sessionStats.nLevel,
        mode: sessionStats.mode,
        accuracy: sessionStats.overallAccuracy,
      });
    }
  }, [sessionStats, user, displayName]);

  return (
    <div className="flex flex-col items-center w-full max-w-4xl mx-auto py-2 px-3 sm:px-4 space-y-4">
      {/* N-Back Tab Navigation Bar (頁籤樣式) */}
      <div className="w-full flex items-center justify-between border-b border-slate-800/80 pb-3 gap-2 flex-wrap sm:flex-nowrap">
        {/* Left: Tab options */}
        <div className="flex items-center gap-1 sm:gap-1.5 p-1 bg-slate-900/90 rounded-2xl border border-slate-800">
          <button
            onClick={() => setActiveTab('train')}
            className={`flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              activeTab === 'train'
                ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Brain className="w-4 h-4 text-indigo-300" />
            <span>訓練挑戰</span>
          </button>

          <button
            onClick={() => {
              if (isPlaying) stopGame();
              setActiveTab('settings');
            }}
            className={`flex items-center gap-1.5 px-3 sm:px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
              activeTab === 'settings'
                ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-md shadow-indigo-600/30'
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
            className={`flex items-center gap-1.5 px-3 sm:px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
              activeTab === 'analytics'
                ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <TrendingUp className="w-4 h-4 text-indigo-400" />
            <span>趨勢</span>
          </button>

          <button
            onClick={() => {
              if (isPlaying) stopGame();
              setActiveTab('tutorial');
            }}
            className={`flex items-center gap-1.5 px-3 sm:px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
              activeTab === 'tutorial'
                ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <HelpCircle className="w-4 h-4 text-cyan-400" />
            <span>教學</span>
          </button>
        </div>

        {/* Right: Sound toggle and test */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={handleToggleSound}
            className={`flex items-center gap-1 px-2.5 sm:px-3 py-2 rounded-xl border text-xs sm:text-sm font-semibold transition ${
              settings.soundEnabled
                ? 'bg-slate-800/80 hover:bg-slate-750 border-slate-700/60 text-slate-300 hover:text-white'
                : 'bg-rose-950/60 border-rose-800/80 text-rose-300 hover:text-rose-100'
            }`}
            title={settings.soundEnabled ? '喇叭已開啟 (點擊靜音)' : '喇叭已靜音 (點擊開啟)'}
          >
            {settings.soundEnabled ? (
              <Volume2 className="w-4 h-4 text-indigo-400" />
            ) : (
              <VolumeX className="w-4 h-4 text-rose-400" />
            )}
            <span>喇叭</span>
          </button>

          <button
            onClick={handleTestSound}
            className={`flex items-center gap-1 px-3 py-2 rounded-xl border text-xs sm:text-sm font-semibold transition active:scale-95 ${
              isTestingSound
                ? 'bg-cyan-500 text-white border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.6)] animate-pulse'
                : 'bg-indigo-600/30 hover:bg-indigo-600/50 border-indigo-500/50 text-indigo-200 hover:text-white shadow-sm'
            }`}
            title="點擊測試音效與語音"
          >
            <Volume2 className={`w-3.5 h-3.5 text-cyan-400 ${isTestingSound ? 'animate-bounce' : ''}`} />
            <span>{isTestingSound ? '測試中' : '測試'}</span>
          </button>
        </div>
      </div>

      {/* Tab 1: 訓練挑戰 (Game Arena) */}
      {activeTab === 'train' && (
        <>
          {soundNotice && (
            <div className="w-full p-3 rounded-2xl bg-indigo-950/80 border border-indigo-500/50 text-indigo-200 text-xs sm:text-sm flex items-center justify-between shadow-lg shadow-indigo-950/50 animate-fadeIn">
              <div className="flex items-center gap-2">
                <div className="p-1 rounded-lg bg-indigo-500/20 text-indigo-400 flex-shrink-0 animate-pulse">
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
              <span>最佳積分：<strong className="text-amber-400">{highScore}</strong></span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800/60 border border-slate-700">
              <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-cyan-400" />
              <span>自適應難度：<strong className={settings.adaptiveDifficulty ? "text-emerald-400" : "text-slate-400"}>{settings.adaptiveDifficulty ? '開啟中' : '關閉'}</strong></span>
            </div>
          </div>

          {/* Main Game Stage or Session Stats */}
          {sessionStats ? (
            <NBackStats stats={sessionStats} onPlayAgain={startGame} />
          ) : (
            <div className="flex flex-col items-center w-full space-y-4">
              <NBackGrid
                currentStimulus={currentStimulus}
                showStimulus={showStimulus}
                mode={settings.mode}
                isPlaying={isPlaying}
              />

              <NBackControls
                isPlaying={isPlaying}
                mode={settings.mode}
                nLevel={settings.nLevel}
                currentTrialIdx={currentTrialIdx}
                totalTrials={totalTrials}
                currentResponse={currentResponse}
                feedback={feedback}
                onStart={startGame}
                onStop={stopGame}
                onPositionMatch={handlePositionMatch}
                onAudioMatch={handleAudioMatch}
              />
            </div>
          )}
        </>
      )}

      {/* Tab 2: 設定 (Inline Settings Panel) */}
      {activeTab === 'settings' && (
        <div className="w-full max-w-xl glass-panel rounded-2xl p-5 sm:p-6 space-y-5 animate-fadeIn">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2 font-bold text-white text-base sm:text-lg">
              <Sliders className="w-5 h-5 text-amber-400" />
              <span>N-Back 設定</span>
            </div>
            <button
              onClick={() => setActiveTab('train')}
              className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs sm:text-sm font-semibold transition shadow-sm"
            >
              保存並開始訓練
            </button>
          </div>

          {/* Mode Selection */}
          <div className="space-y-2">
            <label className="text-xs sm:text-sm font-semibold text-slate-300">訓練模式 (Mode)</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'dual', label: '雙重 (Dual)', desc: '位置 + 聽覺' },
                { id: 'position', label: '空間位置', desc: '單純位置' },
                { id: 'audio', label: '聽覺語音', desc: '單純字母' },
              ].map(m => (
                <button
                  key={m.id}
                  onClick={() => {
                    const next = { ...settings, mode: m.id as any };
                    setSettings(next);
                    storage.saveNBackSettings(next);
                  }}
                  className={`p-3 rounded-xl border text-center transition flex flex-col items-center gap-1 ${
                    settings.mode === m.id
                      ? 'bg-indigo-600/30 border-indigo-500 text-indigo-200 shadow-sm'
                      : 'bg-slate-800/40 border-slate-700/60 text-slate-400 hover:bg-slate-800'
                  }`}
                >
                  <span className="font-bold text-xs sm:text-sm">{m.label}</span>
                  <span className="text-[10px] text-slate-400">{m.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* N Level */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-xs sm:text-sm font-semibold text-slate-300">難度等級 (N-Level)</label>
              <span className="text-sm sm:text-base font-bold text-indigo-400 px-2.5 py-0.5 bg-indigo-500/10 rounded-md border border-indigo-500/20">
                {settings.nLevel}-Back
              </span>
            </div>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map(lvl => (
                <button
                  key={lvl}
                  onClick={() => {
                    const next = { ...settings, nLevel: lvl };
                    setSettings(next);
                    storage.saveNBackSettings(next);
                  }}
                  className={`flex-1 py-2 rounded-xl font-bold text-sm border transition ${
                    settings.nLevel === lvl
                      ? 'bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-500/20'
                      : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-750'
                  }`}
                >
                  {lvl}
                </button>
              ))}
            </div>
            <p className="text-xs text-slate-500">
              {settings.nLevel === 1 && '入門：回憶前 1 步的刺激（適合初學者）'}
              {settings.nLevel === 2 && '標準：回憶前 2 步的刺激（推薦日常鍛鍊）'}
              {settings.nLevel === 3 && '進階：回憶前 3 步的刺激（高度專注挑戰）'}
              {settings.nLevel >= 4 && '天才級：極限工作記憶挑戰！'}
            </p>
          </div>

          {/* Adaptive Difficulty Toggle */}
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-800/40 border border-slate-700/50">
            <div className="flex items-center gap-2.5">
              <Zap className="w-5 h-5 text-amber-400" />
              <div>
                <div className="text-xs sm:text-sm font-semibold text-slate-200">自適應難度 (Adaptive)</div>
                <div className="text-[11px] text-slate-400">正確率 ≥80% 自動升級，&lt;50% 降級</div>
              </div>
            </div>
            <input
              type="checkbox"
              checked={settings.adaptiveDifficulty}
              onChange={e => {
                const next = { ...settings, adaptiveDifficulty: e.target.checked };
                setSettings(next);
                storage.saveNBackSettings(next);
              }}
              className="w-5 h-5 rounded accent-indigo-500 cursor-pointer"
            />
          </div>

          {/* Interval Duration (Speed) */}
          <div className="space-y-2">
            <label className="text-xs sm:text-sm font-semibold text-slate-300">刺激間隔時間 (節奏速度)</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { time: 2200, label: '放鬆 (2.2s)' },
                { time: 1800, label: '標準 (1.8s)' },
                { time: 1400, label: '敏捷 (1.4s)' },
              ].map(speed => (
                <button
                  key={speed.time}
                  onClick={() => {
                    const next = { ...settings, intervalDuration: speed.time };
                    setSettings(next);
                    storage.saveNBackSettings(next);
                  }}
                  className={`py-2.5 px-1 rounded-xl text-xs font-semibold border transition text-center ${
                    settings.intervalDuration === speed.time
                      ? 'bg-cyan-600/30 border-cyan-500 text-cyan-200 shadow-sm'
                      : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:bg-slate-750'
                  }`}
                >
                  {speed.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: 趨勢 (Inline Analytics Panel) */}
      {activeTab === 'analytics' && (
        <div className="w-full max-w-2xl glass-panel rounded-2xl p-5 sm:p-6 space-y-5 animate-fadeIn">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2 font-bold text-white text-base sm:text-lg">
              <TrendingUp className="w-5 h-5 text-indigo-400" />
              <span>N-Back 趨勢與分析</span>
            </div>
            <button
              onClick={() => setActiveTab('train')}
              className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs sm:text-sm font-semibold transition shadow-sm"
            >
              返回訓練挑戰
            </button>
          </div>

          {/* Trend Chart */}
          <div className="w-full bg-slate-900/60 border border-slate-800 rounded-xl p-3 sm:p-4">
            <h3 className="text-xs font-semibold text-slate-400 mb-2">近期分數成長趨勢</h3>
            <ScoreTrendChart
              data={storage.getGameHistory('nback', user?.id)}
              color="#6366f1"
              unit="分"
            />
          </div>

          {/* History list */}
          <div className="space-y-2">
            <h3 className="text-xs font-semibold text-slate-400">近期訓練記錄</h3>
            <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
              {history.length === 0 ? (
                <div className="text-center py-6 text-slate-500 text-xs sm:text-sm">
                  目前尚無訓練記錄，點擊「訓練挑戰」開始第一次訓練吧！
                </div>
              ) : (
                history.slice(0, 10).map((item, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-slate-850/60 border border-slate-800/80 flex items-center justify-between text-xs sm:text-sm"
                  >
                    <div>
                      <div className="font-bold text-white flex items-center gap-2">
                        <span>{item.nLevel}-Back</span>
                        <span className="text-[11px] font-normal text-slate-400">({item.mode})</span>
                      </div>
                      <div className="text-[11px] text-slate-500">{item.date}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-extrabold text-emerald-400">{item.overallAccuracy}% 正確率</div>
                      <div className="text-[11px] text-amber-400 font-semibold">{item.score} 分</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: 教學 (Inline Tutorial Panel) */}
      {activeTab === 'tutorial' && (
        <div className="w-full max-w-xl glass-panel rounded-2xl p-5 sm:p-6 space-y-5 animate-fadeIn">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2 font-bold text-white text-base sm:text-lg">
              <HelpCircle className="w-5 h-5 text-cyan-400" />
              <span>N-Back 教學說明</span>
            </div>
            <button
              onClick={() => setActiveTab('train')}
              className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs sm:text-sm font-semibold transition shadow-sm"
            >
              馬上開始挑戰
            </button>
          </div>

          <div className="space-y-4 text-xs sm:text-sm text-slate-300">
            <div className="p-3.5 rounded-xl bg-indigo-950/40 border border-indigo-500/30">
              <h4 className="font-bold text-indigo-300 mb-1">什麼是 N-Back？</h4>
              <p className="text-slate-300 leading-relaxed">
                N-Back 是神經科學界公認能有效鍛鍊<strong>工作記憶（Working Memory）</strong>與提升<strong>流體智力（Fluid Intelligence）</strong>的腦力訓練方式。
              </p>
            </div>

            <div className="space-y-2">
              <h4 className="font-bold text-white">核心規則：</h4>
              <ul className="list-disc list-inside space-y-1.5 text-slate-400">
                <li><strong className="text-slate-200">1-Back：</strong>目前的刺激與「前 1 步」相同即匹配。</li>
                <li><strong className="text-slate-200">2-Back（標準）：</strong>回想「前 2 步」的位置或字母是否相同。</li>
                <li><strong className="text-slate-200">3-Back（進階）：</strong>回想「前 3 步」的位置或字母是否相同。</li>
              </ul>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-850/60 border border-slate-800 space-y-2">
              <h4 className="font-bold text-white">鍵盤快捷鍵：</h4>
              <div className="flex items-center gap-4 text-xs">
                <span className="flex items-center gap-1.5">
                  <kbd className="px-2 py-1 rounded bg-slate-800 border border-slate-700 font-mono text-cyan-300">A</kbd>
                  <span>位置匹配</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <kbd className="px-2 py-1 rounded bg-slate-800 border border-slate-700 font-mono text-indigo-300">L</kbd>
                  <span>字母匹配</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <kbd className="px-2 py-1 rounded bg-slate-800 border border-slate-700 font-mono text-amber-300">Space</kbd>
                  <span>開始挑戰</span>
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

