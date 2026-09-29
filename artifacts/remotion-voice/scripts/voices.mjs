// Lists candidate voices from the Fish Audio library:  node scripts/voices.mjs ru  |  node scripts/voices.mjs en
import { searchVoices } from './fish.mjs';

const lang = process.argv[2] || 'ru';
const title = process.argv[3] || '';
for (const v of await searchVoices({ language: lang, title, pageSize: 15 })) {
  console.log(`${v.id}\t${v.uses ?? 0} uses\t${v.likes ?? 0} likes\t${(v.languages || []).join(',')}\t${v.title}`);
}
