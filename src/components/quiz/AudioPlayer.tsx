'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { Material } from '@/lib/types';

/**
 * Плеер для IELTS Listening.
 *
 * Приоритет: готовый MP3 из /public/audio/ielts/*.mp3.
 * Если файла ещё нет (404 / не задан src) — честный fallback:
 *   1) временная озвучка транскрипта через SpeechSynthesis (помечена в UI);
 *   2) если и она недоступна — сообщение команде, что аудио не загружено.
 *
 * Browser TTS здесь — только временный preview для демо, не production-решение:
 * в бою подкладываются студийные MP3 тем же именем файла.
 */

type Mode = 'file' | 'tts' | 'unavailable';

export default function AudioPlayer({ material }: { material: Material }) {
  const audio = material.audio;
  const maxPlays = audio?.maxPlays ?? 2;

  const [mode, setMode] = useState<Mode>(audio?.src ? 'file' : 'unavailable');
  const [plays, setPlays] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [pendingAfterSwitch, setPendingAfterSwitch] = useState(false);
  const [duration, setDuration] = useState(audio?.durationSec ?? 0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const pendingRef = useRef(false);

  const canPlay = plays < maxPlays && mode !== 'unavailable';

  const stopTts = useCallback(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    setPlaying(false);
  }, []);

  useEffect(() => () => stopTts(), [stopTts]);

  const onFileError = () => {
    // MP3 ещё не загружен — переключаемся на временный режим.
    // Если пользователь уже нажал «Слушать», доигрываем в fallback сразу.
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      if (pendingRef.current) {
        pendingRef.current = false;
        setMode('tts');
        // playTts вызывается в effect'е ниже, когда mode уже tts
        setPendingAfterSwitch(true);
      } else {
        setMode('tts');
      }
    } else {
      setMode('unavailable');
    }
  };

  const playTts = useCallback(() => {
    if (!audio?.transcript) return;
    stopTts();
    const utterance = new SpeechSynthesisUtterance(audio.transcript);
    utterance.lang = 'en-GB';
    utterance.rate = 0.95;
    utterance.onstart = () => setPlaying(true);
    utterance.onend = () => {
      setPlaying(false);
      setProgress(1);
    };
    utterance.onerror = () => setPlaying(false);
    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  }, [audio, stopTts]);

  // Как только перешли в tts из-за ошибки файла — доигрываем начатое прослушивание.
  useEffect(() => {
    if (mode !== 'tts' || !pendingAfterSwitch) return;
    const id = window.setTimeout(() => {
      setPendingAfterSwitch(false);
      playTts();
    }, 0);
    return () => window.clearTimeout(id);
  }, [mode, pendingAfterSwitch, playTts]);

  const handlePlay = () => {
    if (!canPlay) return;
    setPlays((p) => p + 1);

    if (mode === 'file' && audioRef.current) {
      pendingRef.current = true;
      void audioRef.current.play().then(
        () => {
          pendingRef.current = false;
        },
        () => {
          // ошибка загрузки обработана в onError
        },
      );
      return;
    }
    if (mode === 'tts') {
      playTts();
    }
  };

  const togglePause = () => {
    if (mode === 'file' && audioRef.current) {
      if (audioRef.current.paused) {
        void audioRef.current.play();
      } else {
        audioRef.current.pause();
      }
      return;
    }
    if (mode === 'tts') {
      if (playing) {
        stopTts();
      }
    }
  };

  const timeLabel = duration
    ? `${formatSec(Math.round(progress * duration))} / ${formatSec(Math.round(duration))}`
    : `${plays} / ${maxPlays} прослушиваний`;

  return (
    <div className="card-ink rounded-md p-4">
      <div className="flex items-center justify-between gap-3">
        <span className="label flex items-center gap-2 text-red"><span aria-hidden="true" className="inline-block h-1.5 w-1.5 bg-red" />Аудио</span>
        <span className="label text-ink-faint">{timeLabel}</span>
      </div>

      <p className="mt-2 text-[0.95rem] text-ink-soft">{material.text}</p>

      {mode === 'file' ? (
        <audio
          ref={audioRef}
          src={audio?.src}
          preload="none"
          onError={onFileError}
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          onEnded={() => {
            setPlaying(false);
            setProgress(1);
          }}
          onLoadedMetadata={(e) => {
            const d = e.currentTarget.duration;
            if (Number.isFinite(d) && d > 0) setDuration(d);
          }}
          onTimeUpdate={(e) => {
            const el = e.currentTarget;
            if (el.duration > 0) setProgress(el.currentTime / el.duration);
          }}
          className="hidden"
        />
      ) : null}

      <div className="mt-4 flex flex-wrap items-center gap-2.5">
        <button
          type="button"
          className="btn btn-primary btn-small"
          onClick={playing ? togglePause : handlePlay}
          disabled={!playing && !canPlay}
          aria-label={playing ? 'Пауза' : 'Воспроизвести запись'}
        >
          {playing ? (
            <>
              <PauseIcon /> Пауза
            </>
          ) : (
            <>
              <PlayIcon /> {plays === 0 ? 'Слушать' : `Слушать ещё раз (${maxPlays - plays})`}
            </>
          )}
        </button>

        {plays > 0 && !playing ? (
          <button
            type="button"
            className="btn btn-quiet btn-small"
            onClick={togglePause}
            aria-label="Проиграть с начала"
          >
            С начала
          </button>
        ) : null}
      </div>

      <div className="meter mt-4" aria-hidden="true">
        <span
          className="meter-fill"
          style={{ width: `${Math.round(progress * 100)}%`, transition: 'width 200ms linear' }}
        />
      </div>

      {mode === 'tts' ? (
        <p className="mt-3 text-[0.75rem] leading-snug text-ink-faint">
          Временный режим: запись озвучена браузером, пока студийное аудио не
          загружено. На результат это не влияет.
        </p>
      ) : null}

      {mode === 'unavailable' ? (
        <p className="mt-3 text-[0.8rem] leading-snug text-red">
          Аудио для этой записи ещё не загружено. Ответь на вопрос по описанию
          или пропусти его — диагностика продолжится.
        </p>
      ) : null}

      {plays >= maxPlays && !playing ? (
        <p className="mt-3 text-[0.75rem] text-ink-faint">
          Как на настоящем IELTS: запись доступна ограниченное число раз.
        </p>
      ) : null}
    </div>
  );
}

function formatSec(total: number): string {
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function PlayIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden="true">
      <path d="M8 5.5v13l11-6.5-11-6.5z" />
    </svg>
  );
}

function PauseIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden="true">
      <path d="M7 5h3.5v14H7V5zm6.5 0H17v14h-3.5V5z" />
    </svg>
  );
}
