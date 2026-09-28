'use client';

import { useEffect, useState } from 'react';
import styles from './Library.module.css';

export default function ListeningAudio({ script }: { script: string }) {
  const [status, setStatus] = useState('');
  useEffect(() => () => { window.speechSynthesis?.cancel(); }, []);
  function play() {
    if (!('speechSynthesis' in window)) { setStatus('Синтез речи недоступен. Попросите партнёра прочитать скрипт из раскрывающегося разбора.'); return; }
    const voices = window.speechSynthesis.getVoices().filter((voice) => voice.localService && /^en(?:-|_)/i.test(voice.lang));
    if (!voices.length) { setStatus('Локальный английский голос недоступен. Используйте партнёра или официальное аудио по ссылке в библиотеке.'); return; }
    window.speechSynthesis.cancel();
    const speech = new SpeechSynthesisUtterance(script);
    speech.voice = voices[0]; speech.lang = voices[0].lang; speech.rate = .9;
    speech.onend = () => setStatus('Прослушивание закончено. Теперь сравните свою попытку с разбором.');
    speech.onerror = () => setStatus('Не удалось воспроизвести. Скрипт доступен в разборе.');
    window.speechSynthesis.speak(speech); setStatus('Воспроизводится синтетический голос устройства.');
  }
  return <div className={styles.audio}><strong>Сначала прослушайте, не открывая скрипт</strong><p>Авторский текст ASHYQ. Только локальный английский голос устройства, если он доступен; не официальное аудио IELTS. Нет внешнего сервиса озвучки.</p><div className={styles.actions}><button type="button" onClick={play}>Прослушать текст</button><button type="button" onClick={() => { window.speechSynthesis?.cancel(); setStatus('Воспроизведение остановлено.'); }}>Остановить</button></div><p role="status" aria-live="polite">{status}</p></div>;
}
