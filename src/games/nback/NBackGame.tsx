import React, { useState, useEffect } from 'react';
import { useNBack } from './useNBack';
import { NBackGrid } from './NBackGrid';
import { NBackControls } from './NBackControls';
import { NBackStats } from './NBackStats';
import { NBackSettingsModal } from './NBackSettingsModal';
import { NBackTutorialModal } from './NBackTutorialModal';
import { storage } from '../../utils/storage';
import { Sliders, HelpCircle, Trophy, Sparkles, Brain, History, Volume2, TrendingUp } from 'lucide-react';
import { NBackSessionStats } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../utils/supabase';
import { sound } from '../../utils/sound';
import { AnalyticsModal } from '../../components/analytics/AnalyticsModal';

export const NBackGame: React.FC = () => {
  const { user, displayName } = useAuth();
  const initialSettings = storage.getNBackSettings();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isTutorialOpen, setIsTutorialOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isAnalyticsOpen, setIsAnalyticsOpen] = useState(false);
  const [history, setHistory] = useState<NBackSessionStats[]>([]);
  const [highScore, setHighScore] = useState<number>(0);
  const [soundTested, setSoundTested] = useState(false);
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
    setSoundTested(true);
    sound.testSound();
    setSoundNotice('正在播放測試音效（三連音階 + 字母 C 真人語音）！若未聽見，請檢查設備音量或瀏覽器分頁是否靜音。');

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
    <div className="flex flex-col items-center w-full max-w-4xl mx-auto py-2 px-4 space-y-5">
      {/* Top Header Bar */}
      <div className="w-full flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl glass-panel shadow-lg">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 shadow-md shadow-indigo-500/30 text-white">
            <Brain className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-wide flex items-center gap-2">
              N-Back 大腦記憶訓練
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                {settings.nLevel}-Back
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              {settings.mode === 'dual' ? '雙重模式 (Dual N-Back: 空間位置 + 語音字母)' : settings.mode === 'position' ? '空間位置模式 (Spatial N-Back)' : '聽覺字母模式 (Audio N-Back)'}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Quick Sound Mute/Unmute (聲音開關) */}
          <button
            onClick={handleToggleSound}
            className={`p-2 rounded-xl border text-xs sm:text-sm font-medium transition ${
              settings.soundEnabled
                ? 'bg-slate-800/80 hover:bg-slate-750 border-slate-700/60 text-slate-300 hover:text-white'
                : 'bg-rose-950/60 border-rose-800/80 text-rose-300 hover:text-rose-100'
            }`}
            title={settings.soundEnabled ? '音效開啟 (點擊靜音)' : '音效已靜音 (點擊開啟)'}
          >
            {settings.soundEnabled ? <Volume2 className="w-4 h-4 text-indigo-400" /> : <span className="text-rose-400 text-xs font-bold">🔇 靜音</span>}
          </button>

          {/* Sound Test Button (放在聲音開關的右邊) */}
          <button
            onClick={handleTestSound}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs sm:text-sm font-semibold transition active:scale-95 ${
              isTestingSound
                ? 'bg-cyan-500 text-white border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.6)] animate-pulse'
                : 'bg-indigo-600/30 hover:bg-indigo-600/50 border-indigo-500/50 text-indigo-200 hover:text-white shadow-sm'
            }`}
            title="點擊測試音效與字母語音"
          >
            <Volume2 className={`w-4 h-4 text-cyan-400 ${isTestingSound ? 'animate-bounce' : ''}`} />
            <span>{isTestingSound ? '播放測試中...' : soundTested ? '🔊 測試聲音 (已播)' : '🔊 測試聲音'}</span>
          </button>

          <button
            onClick={() => setIsTutorialOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-750 border border-slate-700/60 text-slate-300 text-xs sm:text-sm font-medium transition hover:text-white"
          >
            <HelpCircle className="w-4 h-4 text-indigo-400" />
            <span>教學</span>
          </button>

          <button
            onClick={() => setIsAnalyticsOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600/30 hover:bg-indigo-600/50 border border-indigo-500/50 text-indigo-300 text-xs sm:text-sm font-semibold transition hover:text-white"
          >
            <TrendingUp className="w-4 h-4 text-indigo-400" />
            <span>趨勢</span>
          </button>

          <button
            onClick={() => setIsSettingsOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-750 border border-slate-700/60 text-slate-300 text-xs sm:text-sm font-medium transition hover:text-white"
          >
            <Sliders className="w-4 h-4 text-amber-400" />
            <span>參數設定</span>
          </button>
        </div>
      </div>

      {/* Sound notification prompt banner */}
      {soundNotice && (
        <div className="w-full p-3.5 rounded-2xl bg-indigo-950/80 border border-indigo-500/50 text-indigo-200 text-xs sm:text-sm flex items-center justify-between shadow-lg shadow-indigo-950/50 animate-fadeIn">
          <div className="flex items-center gap-2.5">
            <div className="p-1 rounded-lg bg-indigo-500/20 text-indigo-400 flex-shrink-0 animate-pulse">
              <Volume2 className="w-5 h-5" />
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
      <div className="flex items-center gap-4 text-xs sm:text-sm text-slate-300 font-medium">
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800/60 border border-slate-700">
          <Trophy className="w-4 h-4 text-amber-400" />
          <span>最佳積分：<strong className="text-amber-400">{highScore}</strong></span>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800/60 border border-slate-700">
          <Sparkles className="w-4 h-4 text-cyan-400" />
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

      {/* Modals */}
      <NBackSettingsModal
        isOpen={isSettingsOpen}
        settings={settings}
        onClose={() => setIsSettingsOpen(false)}
        onUpdate={setSettings}
      />

      <NBackTutorialModal
        isOpen={isTutorialOpen}
        onClose={() => setIsTutorialOpen(false)}
      />

      {/* History Modal */}
      {isHistoryOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-850">
              <div className="flex items-center gap-2 font-bold text-lg text-white">
                <History className="w-5 h-5 text-cyan-400" />
                <span>歷史訓練統計記錄</span>
              </div>
              <button
                onClick={() => setIsHistoryOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-3">
              {history.length === 0 ? (
                <div className="text-center py-8 text-slate-500 text-sm">
                  目前尚無訓練記錄，點擊「開始挑戰」展開第一次訓練吧！
                </div>
              ) : (
                history.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/60 flex items-center justify-between text-xs sm:text-sm"
                  >
                    <div>
                      <div className="font-bold text-white flex items-center gap-2">
                        <span>{item.nLevel}-Back</span>
                        <span className="text-[11px] font-normal text-slate-400">({item.mode})</span>
                      </div>
                      <div className="text-[11px] text-slate-500">{item.date}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-extrabold text-base text-emerald-400">{item.overallAccuracy}%</div>
                      <div className="text-[11px] text-amber-400 font-semibold">{item.score} 分</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Analytics Modal */}
      <AnalyticsModal
        isOpen={isAnalyticsOpen}
        onClose={() => setIsAnalyticsOpen(false)}
        initialGameId="nback"
      />
    </div>
  );
};
