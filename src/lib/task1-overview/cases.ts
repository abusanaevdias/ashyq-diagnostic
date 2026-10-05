export const accuracyReasons = ['Неверный масштаб изменения', 'Неверное сравнение или ранг', 'Причина не показана данными', 'Утверждение верно'];
export type OverviewItem = {
  id: string; title: string; unit: string; years: number[];
  series: { name: string; values: number[] }[];
  claims: { text: string; main: boolean; evidence: number; explanation: string }[];
  evidence: string[];
  inaccurate: { text: string; reason: number; correction: string }[];
  modelOverview: string;
  modelResponse: string;
};

// Original synthetic chart data and text, not official IELTS material.
export const overviewItems: OverviewItem[] = [
  {
    id: 'transport', title: 'Annual trips by three modes of transport in a town', unit: 'million trips', years: [2016,2018,2020,2022],
    series: [{ name:'Bus',values:[42,50,58,64] },{ name:'Rail',values:[30,38,46,50] },{ name:'Bicycle',values:[10,11,11,12] }],
    evidence: ['Bus: 42 → 64; Rail: 30 → 50', 'Bicycle: 10 → 11 → 11 → 12, below the other two in every year', 'Bus exceeds Rail and Bicycle in all four recorded years', 'Утверждение не подтверждается данными', 'Bus: 50 in 2018'],
    claims: [
      {text:'Bus and rail use both rose substantially over the period.',main:true,evidence:0,explanation:'Обе линии заметно выросли от начала к концу; это общий тренд.'},
      {text:'Bicycle use changed only slightly and stayed the lowest.',main:true,evidence:1,explanation:'Слабое изменение и устойчиво низкий уровень отличают эту линию от остальных.'},
      {text:'Bus was the most used mode in every recorded year.',main:true,evidence:2,explanation:'Устойчивый ранг помогает увидеть картину целиком.'},
      {text:'Bus recorded 50 million trips in 2018.',main:false,evidence:4,explanation:'Факт верен, но одна точка — деталь для основного абзаца, а не главный обзор.'},
      {text:'Bus use doubled between 2016 and 2022.',main:false,evidence:3,explanation:'64 не равно удвоенным 42: для удвоения нужно 84.'},
      {text:'Lower fares caused the rise in rail use.',main:false,evidence:3,explanation:'Тарифов и причин на графике нет.'},
    ],
    inaccurate: [
      {text:'Bus trips doubled from 42 to 64 million.',reason:0,correction:'Bus trips increased from 42 to 64 million, a rise of 22 million.'},
      {text:'Bicycle use was the highest throughout the period.',reason:1,correction:'Bicycle use was the lowest in every recorded year.'},
      {text:'Rail use rose because fares became cheaper.',reason:2,correction:'Rail use rose from 30 to 50 million trips; the chart gives no reason for the change.'},
    ],
    modelOverview:'Overall, bus and rail use increased considerably, while bicycle use changed only slightly and remained the least used of the three modes. Bus travel had the highest number of trips in every recorded year.',
    modelResponse:'The line chart compares the annual number of bus, rail and bicycle trips in a town in four recorded years from 2016 to 2022. The figures are measured in millions of trips.\n\nOverall, bus and rail use increased considerably, whereas bicycle use changed only slightly. Bus travel recorded the highest figure in every year, and bicycle travel remained the least used of the three modes.\n\nBus trips rose from 42 million in 2016 to 50 million in 2018 and 58 million in 2020, before reaching 64 million in 2022. Rail followed a similar upward pattern, increasing from 30 million to 38 million and then to 46 million. Its final figure was 50 million, which was 20 million above the starting level.\n\nBicycle trips, in contrast, increased only from 10 million to 12 million overall. They stood at 11 million in both 2018 and 2020. The gap between bicycle travel and the other two modes was therefore greater at the end of the period than at the beginning.',
  },
  {
    id:'libraries', title:'Annual visits to three community libraries',unit:'thousand visits',years:[2016,2018,2020,2022],
    series:[{name:'East',values:[24,30,36,42]},{name:'West',values:[38,36,33,30]},{name:'South',values:[10,11,11,12]}],
    evidence:['East: 24 → 42; West: 38 → 30', 'East: 24 < West: 38 at the start; East: 42 > West: 30 at the end', 'South: 10 → 11 → 11 → 12, the lowest throughout', 'Утверждение не подтверждается данными', 'West: 36 in 2018'],
    claims:[
      {text:'East visits rose, whereas West visits fell.',main:true,evidence:0,explanation:'Противоположные тренды двух основных линий — важная общая характеристика.'},
      {text:'East overtook West during the period.',main:true,evidence:1,explanation:'В начале West выше, в конце East выше. Не называй точную дату пересечения между измерениями.'},
      {text:'South changed little and remained the least visited.',main:true,evidence:2,explanation:'Третья линия отличается слабым ростом и устойчивым низким рангом.'},
      {text:'West had 36 thousand visits in 2018.',main:false,evidence:4,explanation:'Это верная отдельная точка, а не главный тренд.'},
      {text:'West visits halved over the period.',main:false,evidence:3,explanation:'Падение с 38 до 30 не является сокращением вдвое.'},
      {text:'East gained visitors because a new reading room opened.',main:false,evidence:3,explanation:'Причина изменения не дана.'},
    ],
    inaccurate:[
      {text:'South visits rose because a new room was opened.',reason:2,correction:'South visits rose slightly from 10 to 12 thousand; no cause is shown.'},
      {text:'East was the most visited library throughout the period.',reason:1,correction:'East overtook West and became the most visited by the final recorded year.'},
      {text:'West visits halved from 38 to 30 thousand.',reason:0,correction:'West visits fell from 38 to 30 thousand, a decrease of 8 thousand.'},
    ],
    modelOverview:'Overall, visits to East increased while those to West declined, allowing East to become the most visited library by the end of the period. South remained the least visited and showed only a small change.',
    modelResponse:'The chart compares annual visits to three community libraries in four recorded years between 2016 and 2022. All figures are given in thousands.\n\nOverall, visits to East increased while those to West declined. East overtook West during the period and had the highest final figure. South, by contrast, remained the least visited library and experienced only a small increase.\n\nEast began with 24 thousand visits in 2016, compared with 38 thousand at West. Its total increased to 30 thousand in 2018 and 36 thousand in 2020, then reached 42 thousand in 2022. West followed the opposite pattern, falling from 38 thousand to 36 thousand, then to 33 thousand and finally to 30 thousand. Thus, East was below West at the first two recorded points but above it at the last two.\n\nSouth had only 10 thousand visits at the beginning of the period. This figure rose to 11 thousand in 2018, remained unchanged in 2020 and reached 12 thousand in 2022. It stayed well below both other libraries throughout the recorded years.',
  },
];

export function countWords(value: string) { return value.trim() ? value.trim().split(/\s+/u).length : 0; }
