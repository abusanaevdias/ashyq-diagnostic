import type { Material } from '@/lib/types';

/**
 * Материалы IELTS: три коротких академических passage и две аудиозаписи.
 *
 * Транскрипты хранятся здесь по двум причинам:
 *  1) из них собирается временный TTS-preview, пока нет MP3;
 *  2) по ним команда проверяет качество вопросов.
 * В UI транскрипт НЕ показывается во время прохождения теста.
 */

export const IELTS_MATERIALS: Material[] = [
  {
    id: 'ielts-reading-a',
    exam: 'ielts',
    section: 'reading',
    kind: 'passage',
    tag: 'Passage A',
    title: 'Street trees and city temperatures',
    text: `As cities have grown, so has interest in the effect of street trees on local temperatures. Researchers measuring surface temperatures in three European cities found that streets with a continuous tree canopy were, on average, between two and four degrees Celsius cooler at midday than streets of similar width without trees. The cooling is produced mainly by two mechanisms: shade, which prevents sunlight from reaching the pavement, and evapotranspiration, the process by which water released from leaves absorbs heat from the surrounding air.

The effect was not uniform. Streets planted with broad-leaved species showed stronger cooling than streets planted with narrow conifers, and the largest differences appeared in dense neighbourhoods where buildings and asphalt already stored a great deal of heat. City planners have since used canopy targets rather than simple tree counts, arguing that a hundred young saplings spread across a district do less to cool it than thirty mature trees on the same streets.`,
  },
  {
    id: 'ielts-reading-b',
    exam: 'ielts',
    section: 'reading',
    kind: 'passage',
    tag: 'Passage B',
    title: 'Sleep and memory',
    text: `Sleep has long been linked to memory, but the direction of the relationship remained unclear until researchers began scanning sleeping brains. Work published over the past two decades suggests that sleep, particularly the deep stage known as slow-wave sleep, helps stabilise — or consolidate — information learned during the day.

In one common experimental design, participants memorise lists of word pairs in the morning and are tested either after a night of sleep or after an equivalent period of wakefulness; the sleep group typically recalls more items. Brain imaging has shown that during slow-wave sleep recently encoded memories appear to be replayed and gradually transferred from the hippocampus, a structure involved in fast learning, to the cortex, where long-term storage takes place. Not every kind of memory benefits equally, and researchers caution that a nap helps only when it occurs shortly after learning.`,
  },
  {
    id: 'ielts-reading-c',
    exam: 'ielts',
    section: 'reading',
    kind: 'passage',
    tag: 'Passage C',
    title: 'Vertical farming',
    text: `Vertical farming grows crops indoors in stacked layers, using LED lights and a nutrient solution instead of soil. Supporters point to three advantages: conditions such as temperature and humidity can be controlled precisely, yields per square metre are far higher than in open fields, and water use is reduced because the nutrient solution is recirculated. Because no soil is used, pesticides are largely unnecessary.

The economics, however, remain difficult. Building a facility with climate control and lighting is expensive, and the electricity needed to replace sunlight accounts for a large share of operating costs. As a result, most commercially successful vertical farms grow leafy greens and herbs, crops that are harvested quickly and sold at a premium, while staple crops such as wheat and rice are still considered uneconomical at scale.`,
  },
  {
    id: 'ielts-listening-1',
    exam: 'ielts',
    section: 'listening',
    kind: 'audio',
    tag: 'Recording 1',
    title: 'Sports centre membership',
    text: 'Everyday conversation: a student asks about joining a sports centre.',
    audio: {
      src: '/audio/ielts/listening-1.mp3',
      durationSec: 30,
      maxPlays: 2,
      transcript: `Good morning, Riverside Sports Centre. How can I help?
Hi, I'm a new student and I'd like to join the gym. Could you tell me the price?
That's fifty pounds a month normally, but with a student card it's forty-five. You'll need the card and a passport photo when you sign up.
And what time do you close?
We're open until ten in the evening on weekdays and until six at the weekend. The pool closes at nine, except on Thursdays, when it closes at eight for club training.`,
    },
  },
  {
    id: 'ielts-listening-2',
    exam: 'ielts',
    section: 'listening',
    kind: 'audio',
    tag: 'Recording 2',
    title: 'University tutorial',
    text: 'Educational conversation: a tutor explains an essay task to two students.',
    audio: {
      src: '/audio/ielts/listening-2.mp3',
      durationSec: 35,
      maxPlays: 2,
      transcript: `Right, let's sort out the essay. The word limit is two thousand five hundred words minimum, and please use at least four sources. The reading list has a good starting article.
Do we submit it by email?
No, through the portal. The deadline is Friday at five in the evening. Anything late loses ten percent per day, up to three days, and after that it isn't marked.
Should we split the work?
Dana, you take the data collection. Yerlan, you handle the presentation slides for next week. Write the essay together, and I'll look at a draft if you send it by Wednesday.`,
    },
  },
];
