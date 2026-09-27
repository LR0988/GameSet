import { useState, useEffect, useRef, useCallback } from 'react';
import { NBackSettings, NBackTrial, NBackResponse, NBackTrialResult, NBackSessionStats } from '../../types';
import { sound } from '../../utils/sound';
import { storage } from '../../utils/storage';
import confetti from 'canvas-confetti';

const LETTERS = ['C', 'H', 'K', 'L', 'O', 'Q', 'R', 'T'];

export function useNBack(initialSettings: NBackSettings) {
  const [settings, setSettings] = useState<NBackSettings>(initialSettings);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [currentTrialIdx, setCurrentTrialIdx] = useState<number>(-1);
  const [trials, setTrials] = useState<NBackTrial[]>([]);
  const [currentStimulus, setCurrentStimulus] = useState<NBackTrial | null>(null);
  const [showStimulus, setShowStimulus] = useState<boolean>(false);

  // User input states for current trial
  const [currentResponse, setCurrentResponse] = useState<NBackResponse>({
    positionPressed: false,
    audioPressed: false,
  });

  // Results of all completed trials
  const [trialResults, setTrialResults] = useState<NBackTrialResult[]>([]);
  const [sessionStats, setSessionStats] = useState<NBackSessionStats | null>(null);
  const [feedback, setFeedback] = useState<{
    position?: 'correct' | 'wrong' | 'missed';
    audio?: 'correct' | 'wrong' | 'missed';
  }>({});

  const trialTimerRef = useRef<number | null>(null);
  const stimulusTimerRef = useRef<number | null>(null);
  const responseRef = useRef<NBackResponse>({ positionPressed: false, audioPressed: false });

  // Keep responseRef in sync
  useEffect(() => {
    responseRef.current = currentResponse;
  }, [currentResponse]);

  // Generate sequence of trials ensuring realistic match probabilities
  const generateTrials = useCallback((n: number, count: number, matchProb: number): NBackTrial[] => {
    const list: NBackTrial[] = [];
    for (let i = 0; i < count; i++) {
      let pos = Math.floor(Math.random() * 9);
      let letter = LETTERS[Math.floor(Math.random() * LETTERS.length)];

      let isPosMatch = false;
      let isAudMatch = false;

      // Can only have N-back match after n trials
      if (i >= n) {
        if (Math.random() < matchProb) {
          pos = list[i - n].position;
          isPosMatch = true;
        }
        if (Math.random() < matchProb) {
          letter = list[i - n].letter;
          isAudMatch = true;
        }

        // Double check in case random roll coincided
        if (pos === list[i - n].position) isPosMatch = true;
        if (letter === list[i - n].letter) isAudMatch = true;
      }

      list.push({
        position: pos,
        letter,
        isPositionMatch: isPosMatch,
        isAudioMatch: isAudMatch,
      });
    }
    return list;
  }, []);

  // Finish session
  const finishSession = useCallback((completedResults: NBackTrialResult[]) => {
    setIsPlaying(false);
    setIsPaused(false);
    setCurrentStimulus(null);
    setShowStimulus(false);

    const validTrials = completedResults.filter(r => r.trialIndex >= settings.nLevel);
    const totalValid = validTrials.length;

    let posHits = 0, posMisses = 0, posFAs = 0, posCRs = 0;
    let audHits = 0, audMisses = 0, audFAs = 0, audCRs = 0;

    validTrials.forEach(r => {
      if (r.positionResult === 'hit') posHits++;
      else if (r.positionResult === 'miss') posMisses++;
      else if (r.positionResult === 'false_alarm') posFAs++;
      else if (r.positionResult === 'correct_rejection') posCRs++;

      if (r.audioResult === 'hit') audHits++;
      else if (r.audioResult === 'miss') audMisses++;
      else if (r.audioResult === 'false_alarm') audFAs++;
      else if (r.audioResult === 'correct_rejection') audCRs++;
    });

    const isDual = settings.mode === 'dual';
    const hasPos = isDual || settings.mode === 'position';
    const hasAud = isDual || settings.mode === 'audio';

    const posAcc = totalValid > 0 ? Math.round(((posHits + posCRs) / totalValid) * 100) : 0;
    const audAcc = totalValid > 0 ? Math.round(((audHits + audCRs) / totalValid) * 100) : 0;

    let overallAcc = 0;
    if (isDual) {
      overallAcc = Math.round((posAcc + audAcc) / 2);
    } else if (hasPos) {
      overallAcc = posAcc;
    } else {
      overallAcc = audAcc;
    }

    const calculatedScore = Math.round(overallAcc * settings.nLevel * 10);

    const stats: NBackSessionStats = {
      date: new Date().toLocaleString(),
      nLevel: settings.nLevel,
      mode: settings.mode,
      totalTrials: settings.trials,
      positionHits: posHits,
      positionMisses: posMisses,
      positionFalseAlarms: posFAs,
      positionCorrectRejections: posCRs,
      positionAccuracy: posAcc,
      audioHits: audHits,
      audioMisses: audMisses,
      audioFalseAlarms: audFAs,
      audioCorrectRejections: audCRs,
      audioAccuracy: audAcc,
      overallAccuracy: overallAcc,
      score: calculatedScore,
    };

    setSessionStats(stats);
    storage.saveNBackSession(stats);
    storage.saveHighScore('nback', calculatedScore);

    // Adaptive difficulty handling
    if (settings.adaptiveDifficulty) {
      if (overallAcc >= 80) {
        sound.playLevelUp();
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
        });
        setSettings(prev => {
          const next = { ...prev, nLevel: Math.min(prev.nLevel + 1, 9) };
          storage.saveNBackSettings(next);
          return next;
        });
      } else if (overallAcc < 50 && settings.nLevel > 1) {
        sound.playGameOver();
        setSettings(prev => {
          const next = { ...prev, nLevel: Math.max(prev.nLevel - 1, 1) };
          storage.saveNBackSettings(next);
          return next;
        });
      } else {
        if (overallAcc >= 70) sound.playCorrect();
      }
    } else if (overallAcc >= 80) {
      sound.playLevelUp();
      confetti({ particleCount: 80, spread: 60 });
    }
  }, [settings]);

  // Execute trial cycle
  const runTrial = useCallback((index: number, trialList: NBackTrial[], accumulatedResults: NBackTrialResult[]) => {
    if (index >= trialList.length) {
      finishSession(accumulatedResults);
      return;
    }

    setCurrentTrialIdx(index);
    const trial = trialList[index];
    setCurrentStimulus(trial);
    setShowStimulus(true);
    setCurrentResponse({ positionPressed: false, audioPressed: false });
    setFeedback({});

    // Sound stimulus
    if (settings.soundEnabled && (settings.mode === 'dual' || settings.mode === 'audio')) {
      sound.speakLetter(trial.letter);
    } else if (settings.soundEnabled && settings.mode === 'position') {
      sound.playClick();
    }

    // Hide stimulus after stimulusDuration
    stimulusTimerRef.current = window.setTimeout(() => {
      setShowStimulus(false);
    }, settings.stimulusDuration);

    // Wait for full intervalDuration before evaluating trial and moving to next
    trialTimerRef.current = window.setTimeout(() => {
      const resp = responseRef.current;
      const isPastN = index >= settings.nLevel;

      let posRes: NBackTrialResult['positionResult'] = 'not_applicable';
      let audRes: NBackTrialResult['audioResult'] = 'not_applicable';

      if (settings.mode === 'dual' || settings.mode === 'position') {
        if (isPastN) {
          if (trial.isPositionMatch && resp.positionPressed) posRes = 'hit';
          else if (trial.isPositionMatch && !resp.positionPressed) posRes = 'miss';
          else if (!trial.isPositionMatch && resp.positionPressed) posRes = 'false_alarm';
          else posRes = 'correct_rejection';
        }
      }

      if (settings.mode === 'dual' || settings.mode === 'audio') {
        if (isPastN) {
          if (trial.isAudioMatch && resp.audioPressed) audRes = 'hit';
          else if (trial.isAudioMatch && !resp.audioPressed) audRes = 'miss';
          else if (!trial.isAudioMatch && resp.audioPressed) audRes = 'false_alarm';
          else audRes = 'correct_rejection';
        }
      }

      const result: NBackTrialResult = {
        trialIndex: index,
        trial,
        response: resp,
        positionResult: posRes,
        audioResult: audRes,
      };

      const updated = [...accumulatedResults, result];
      setTrialResults(updated);

      // Next trial
      runTrial(index + 1, trialList, updated);
    }, settings.intervalDuration);
  }, [settings, finishSession]);

  // Start new game
  const startGame = useCallback(() => {
    // Clear any timers
    if (trialTimerRef.current) clearTimeout(trialTimerRef.current);
    if (stimulusTimerRef.current) clearTimeout(stimulusTimerRef.current);

    const totalCount = settings.trials + settings.nLevel;
    const generated = generateTrials(settings.nLevel, totalCount, settings.matchProbability);

    setTrials(generated);
    setTrialResults([]);
    setSessionStats(null);
    setFeedback({});
    setIsPlaying(true);
    setIsPaused(false);

    sound.playClick();
    // Start with 1.5s preparation countdown
    setTimeout(() => {
      runTrial(0, generated, []);
    }, 1000);
  }, [settings, generateTrials, runTrial]);

  // Stop/reset game
  const stopGame = useCallback(() => {
    if (trialTimerRef.current) clearTimeout(trialTimerRef.current);
    if (stimulusTimerRef.current) clearTimeout(stimulusTimerRef.current);
    setIsPlaying(false);
    setIsPaused(false);
    setCurrentStimulus(null);
    setShowStimulus(false);
    setCurrentTrialIdx(-1);
  }, []);

  // Respond to position match
  const handlePositionMatch = useCallback(() => {
    if (!isPlaying || isPaused || currentTrialIdx < 0) return;
    if (currentResponse.positionPressed) return; // already pressed

    setCurrentResponse(prev => ({ ...prev, positionPressed: true }));
    sound.playClick();

    // Instant feedback visual
    if (currentTrialIdx >= settings.nLevel && currentStimulus) {
      if (currentStimulus.isPositionMatch) {
        setFeedback(f => ({ ...f, position: 'correct' }));
      } else {
        setFeedback(f => ({ ...f, position: 'wrong' }));
      }
    }
  }, [isPlaying, isPaused, currentTrialIdx, currentResponse.positionPressed, currentStimulus, settings.nLevel]);

  // Respond to audio/letter match
  const handleAudioMatch = useCallback(() => {
    if (!isPlaying || isPaused || currentTrialIdx < 0) return;
    if (currentResponse.audioPressed) return; // already pressed

    setCurrentResponse(prev => ({ ...prev, audioPressed: true }));
    sound.playClick();

    // Instant feedback visual
    if (currentTrialIdx >= settings.nLevel && currentStimulus) {
      if (currentStimulus.isAudioMatch) {
        setFeedback(f => ({ ...f, audio: 'correct' }));
      } else {
        setFeedback(f => ({ ...f, audio: 'wrong' }));
      }
    }
  }, [isPlaying, isPaused, currentTrialIdx, currentResponse.audioPressed, currentStimulus, settings.nLevel]);

  // Keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (e.code === 'KeyA' || e.key === 'a' || e.key === 'A') {
        if (settings.mode === 'dual' || settings.mode === 'position') {
          handlePositionMatch();
        }
      } else if (e.code === 'KeyL' || e.key === 'l' || e.key === 'L') {
        if (settings.mode === 'dual' || settings.mode === 'audio') {
          handleAudioMatch();
        }
      } else if (e.code === 'Space') {
        if (!isPlaying) startGame();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying, settings.mode, handlePositionMatch, handleAudioMatch, startGame]);

  // Clean up timers on unmount
  useEffect(() => {
    return () => {
      if (trialTimerRef.current) clearTimeout(trialTimerRef.current);
      if (stimulusTimerRef.current) clearTimeout(stimulusTimerRef.current);
    };
  }, []);

  return {
    settings,
    setSettings,
    isPlaying,
    isPaused,
    currentTrialIdx,
    totalTrials: settings.trials + settings.nLevel,
    currentStimulus,
    showStimulus,
    currentResponse,
    trialResults,
    sessionStats,
    feedback,
    startGame,
    stopGame,
    handlePositionMatch,
    handleAudioMatch,
  };
}
