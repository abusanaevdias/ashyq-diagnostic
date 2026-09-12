import type { Material } from '@/lib/types';

/**
 * Материалы (passages / tables / notes) для SAT Reading & Writing.
 * Вынесены отдельно от вопросов: один passage может обслуживать несколько вопросов,
 * а контент-команда Ashyq может править тексты, не трогая логику теста.
 */

export const SAT_RW_MATERIALS: Material[] = [
  {
    id: 'sat-rw-01-material',
    exam: 'sat',
    section: 'rw',
    kind: 'passage',
    tag: 'Questions 1',
    title: 'Mangrove restoration',
    text: `The following text is adapted from a report on coastal restoration.

When mangrove forests along the coast were cleared for shrimp farming, few observers expected the replanting projects that followed to fail. Yet many did. Researchers reviewing thirty restoration sites in Southeast Asia found that projects which began by planting seedlings in open mudflats lost most of those seedlings within two years, while sites where engineers first restored the natural flow of tides and freshwater kept more than eighty percent of what they planted. The difference, the researchers argued, was not the number of trees put in the ground but whether the ground behaved like a mangrove habitat.`,
  },
  {
    id: 'sat-rw-02-material',
    exam: 'sat',
    section: 'rw',
    kind: 'table',
    tag: 'Questions 2',
    title: 'University enrollment',
    text: 'The following table is adapted from a university registrar’s annual summary.',
    table: {
      caption: 'Enrollment at a university, 2019–2023 (number of students)',
      headers: ['Year', 'Undergraduate', 'Graduate', 'Total'],
      rows: [
        ['2019', '400', '200', '600'],
        ['2020', '450', '250', '700'],
        ['2021', '700', '350', '1,050'],
        ['2022', '650', '450', '1,100'],
        ['2023', '1,050', '350', '1,400'],
      ],
      note: 'Students enrolled in at least one course in the autumn term.',
    },
  },
  {
    id: 'sat-rw-03-material',
    exam: 'sat',
    section: 'rw',
    kind: 'passage',
    tag: 'Questions 3',
    title: 'Bridges and temperature',
    text: `The following text is adapted from an engineering handbook.

A bridge is rarely built from a single material. Steel girders carry the load, concrete forms the deck, and the two are joined at points that allow the structure to move. On a hot day the steel expands slightly faster than the concrete around it, and the difference produces stress at the joints. Engineers therefore monitor those joints with strain gauges, small sensors that record how much the material is being pulled or compressed as temperatures rise and fall over a single day.`,
  },
  {
    id: 'sat-rw-04-material',
    exam: 'sat',
    section: 'rw',
    kind: 'passage',
    tag: 'Questions 4',
    title: 'Cross-text: warbler surveys',
    text: `Text 1
Researcher 1: Between 2010 and 2022, the number of warblers counted during spring surveys in the valley rose from about 400 to nearly 900. Because the forests in the valley were placed under protection in 2009, the increase is best explained as the result of conservation measures.

Text 2
Researcher 2: Counts depend on how many birds an observer can detect, not only on how many birds are present. Between 2010 and 2022 the survey teams in the valley switched to a standardised point-count method and received training that improved their ability to identify warblers by song. Detection probability for the species rose from roughly 0.4 to roughly 0.7 over the same period.`,
  },
  {
    id: 'sat-rw-05-material',
    exam: 'sat',
    section: 'rw',
    kind: 'passage',
    tag: 'Questions 5',
    title: 'Local newspaper archives',
    text: `The following text is adapted from an article about public libraries.

Many city libraries keep complete runs of local newspapers, some dating back more than a century. The collections are rarely the reason visitors come through the door, and librarians acknowledge that the shelves they occupy could hold books that circulate far more often. Yet the newspapers record prices, council decisions, school results and obituaries that appear nowhere else, which makes them a continuous account of how the community around the library changed.`,
  },
  {
    id: 'sat-rw-06-material',
    exam: 'sat',
    section: 'rw',
    kind: 'passage',
    tag: 'Questions 6',
    title: 'Terraced fields',
    text: `The following text is adapted from a study of hillside farming.

On steep slopes, heavy rain normally washes topsoil downslope within a single season, taking nutrients with it. Farmers who cut terraces into the hillside slow the water and hold the soil behind low stone walls. Within a few years the erosion that had stripped the fields was largely checked, and yields on the upper terraces rose.`,
  },
  {
    id: 'sat-rw-07-material',
    exam: 'sat',
    section: 'rw',
    kind: 'passage',
    tag: 'Questions 7',
    title: 'Urban heat islands',
    text: `The following text is adapted from a climate research summary.

Cities are often several degrees warmer than the surrounding countryside, a pattern known as the urban heat island effect. Dark roofs and asphalt absorb sunlight during the day and release the stored heat slowly after sunset, while the lack of shade and of water released by plants removes two of the main cooling mechanisms available in rural areas. When cities plant street trees and replace dark surfaces with lighter ones, measured night-time temperatures in those neighbourhoods fall.`,
  },
  {
    id: 'sat-rw-08-material',
    exam: 'sat',
    section: 'rw',
    kind: 'passage',
    tag: 'Questions 8',
    title: 'Notes: student sleep study',
    text: `While researching a topic, a student has taken the following notes:

• Researchers tracked the sleep of 120 first-year students for one month.
• Students were divided into two groups: those with a consistent bedtime and those with irregular bedtimes.
• The consistent-bedtime group averaged 7 hours 50 minutes of sleep per night.
• The irregular-bedtime group averaged 6 hours 20 minutes of sleep per night.
• Both groups rated their daytime alertness on the same scale.
• Average alertness ratings were similar across the two groups.`,
  },
  {
    id: 'sat-rw-09-material',
    exam: 'sat',
    section: 'rw',
    kind: 'passage',
    tag: 'Questions 9',
    title: 'Seed banks',
    text: `Seed banks preserve the genetic diversity of wild plants by storing dried seeds at low temperatures. ______ the collections depend on regular expeditions, and those expeditions are interrupted whenever funding lapses.`,
  },
  {
    id: 'sat-rw-10-material',
    exam: 'sat',
    section: 'rw',
    kind: 'passage',
    tag: 'Questions 10',
    title: 'Elena Alvarez',
    text: `Photographer Elena Alvarez spent a decade documenting abandoned factories in the north of the country, and the repetition of empty windows and stalled machines shaped her ______ have read the series as a quiet argument about what industrial decline leaves behind.`,
  },
  {
    id: 'sat-rw-11-material',
    exam: 'sat',
    section: 'rw',
    kind: 'passage',
    tag: 'Questions 11',
    title: 'Sediment analysis',
    text: `An analysis of sediment samples collected from the riverbed ______ that the water once carried far more silt than it does today.`,
  },
  {
    id: 'sat-rw-12-material',
    exam: 'sat',
    section: 'rw',
    kind: 'passage',
    tag: 'Questions 12',
    title: 'The central library',
    text: `Built in 1911, ______ still holds the original card catalogue.`,
  },
  {
    id: 'sat-rw-13-material',
    exam: 'sat',
    section: 'rw',
    kind: 'passage',
    tag: 'Questions 13',
    title: 'Field season',
    text: `During the field season last summer, the research team collected water samples from eighteen sites and ______ the results into a single dataset.`,
  },
  {
    id: 'sat-rw-14-material',
    exam: 'sat',
    section: 'rw',
    kind: 'passage',
    tag: 'Questions 14',
    title: 'Cycling survey',
    text: `A survey ______ over three months showed that most cyclists in the city avoided the main road even though it was the shortest route.`,
  },
  {
    id: 'sat-rw-15-material',
    exam: 'sat',
    section: 'rw',
    kind: 'passage',
    tag: 'Questions 15',
    title: 'Remote work',
    text: `Remote work became common in the city after 2020, and many companies stopped requiring staff to attend an office. ______ central business districts remain crowded on weekday mornings, largely because cafes, gyms and co-working spaces absorbed the employees who no longer commuted to a desk.`,
  },
  {
    id: 'sat-rw-16-material',
    exam: 'sat',
    section: 'rw',
    kind: 'passage',
    tag: 'Questions 16',
    title: 'Lake bed survey',
    text: `After surveying the lake bed, the team described what it had found as ______ results that later work may revise.`,
  },
];
