import type {DocxBlock} from '../trainers/docx-package';
import {speakingCriteria} from './prompts';
import {speakingTextObservations,validSpeakingTranscriptText} from './transcript';
import {validSpeakingTranscriptReview,type SpeakingTranscriptReview} from './transcript-review';

export function speakingTranscriptReviewBlocks(review?:SpeakingTranscriptReview):DocxBlock[]{
 const blocks:DocxBlock[]=[],field=(name:string,value:unknown)=>blocks.push({kind:'paragraph',text:`${name}: ${value===null?'неизвестно':value===''?'не заполнено':String(value)}`});
 if(!review){field('Расшифровка и отдельная первая самопроверка','в этой версии записи отсутствуют; не восстановлены');return blocks;}
 if(!validSpeakingTranscriptReview(review,review.first.recordingSeconds))throw Error('Расшифровка несовместима. Скачай исходный JSON.');
 blocks.push({kind:'heading3',text:'Первая самопроверка до расшифровки'});field('Зафиксирована',review.openedAt);field('Длительность исходной записи по таймеру',review.first.recordingSeconds);review.first.ratings.forEach((rating,i)=>field(speakingCriteria[i].name,rating));field('Отдельные моменты не выделены',review.first.noSpecificMoments?'да':'нет');review.first.markers.forEach(m=>field(`Первое наблюдение ${m.id}`,`${m.second===null?'без таймкода':m.second+' с'} · ${m.kind}: ${m.note}`));field('План до расшифровки',review.first.plan);
 if(review.draftText)field('Текст, набранный до фиксации расшифровки',review.draftText);
 if(review.skipped){field('Решение пользователя','продолжить без расшифровки');return blocks;}
 const source=review.original;if(!source){field('Расшифровка','ещё не зафиксирована');return blocks;}
 blocks.push({kind:'heading3',text:'Расшифровка · не оценка качества речи'});field('Источник',source.kind==='manual'?'Ручной ввод пользователя; соответствие аудио не проверено':'Сохранённый ответ OpenAI; точность не подтверждена');field('Модель',source.model);field('Дата исходной расшифровки',source.savedAt);field('Хеш переданного WAV',source.audioHash);field('Длительность переданного WAV',source.audioSeconds);field('Исходная расшифровка',source.text);field('Рабочая уточнённая расшифровка',review.revision);field('Объяснение пользователя',review.reflection);field('Явно сохранён исходный текст без изменений',review.unchanged?'да':'нет');
 if(source.words)field('Временные отметки модели · исходные, не акустические измерения',source.words.map(w=>`${w.word} [${w.start}, ${w.end}]`).join('\n'));else field('Временные отметки','недоступны; число пауз и темп не определены');
 if(validSpeakingTranscriptText(review.revision)){
  const observations=speakingTextObservations(source,review.revision);field('Слов в рабочем тексте',observations.wordCount);observations.repeatedPhrases.forEach(p=>field('Повторяющаяся группа слов',p.occurrences.map(span=>`${review.revision.slice(span.start,span.end)} [символы ${span.start}–${span.end}${span.second===null?'':`; отметка модели ${span.second} с`}]`).join('\n')));field('Пар соседних одинаковых слов в тексте',observations.repeatedWords.length);observations.vocabulary.forEach(v=>field(`Вхождения ${v.word} · ограниченный список, не диагноз`,v.occurrences.length));field('Промежутков от 1с между отметками модели',observations.gaps===null?null:observations.gaps.length);field('Слов расшифровки на минуту записи · не беглость',observations.wordsPerRecordingMinute);
 }
 field('Ограничение','Аудио не вложено и не восстанавливается из отчёта. Ошибки распознавания/ручного ввода могут менять наблюдения; это не IELTS band, проверка грамматики или произношения.');return blocks;
}
