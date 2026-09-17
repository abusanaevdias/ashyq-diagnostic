import assert from 'node:assert/strict';
import { CAREER_ANSWERS, CAREER_STATEMENTS } from '../src/data/career/questions';
import { CAREER_PROFILES, CAREER_CODES } from '../src/data/career/profiles';
import { CAREER_PROFESSIONS, CAREER_SPHERES } from '../src/data/career/professions';
import {
  BALANCED_STRENGTH,
  CAREER_AXES,
  CAREER_AXIS_LABELS,
  getCareerProfile,
  isCareerCode,
  matchProfessions,
  rankProfessions,
  scoreCareer,
  type CareerAnswers,
} from '../src/lib/career';

/**
 * Контракт теста «Компас» (CAREER-COMPASS-001) без браузера.
 * Запуск: npx tsx scripts/career-unit-check.ts
 *
 * Главное, что здесь защищается:
 *  1. банк сбалансирован — поровну утверждений на полюс, иначе тест
 *     награждает привычку соглашаться;
 *  2. ни один из 16 профилей не остаётся с пустой выдачей профессий;
 *  3. ровный ноль по шкале не выдаётся за уверенный результат.
 */

const POLE_PAIRS = { EI: ['E', 'I'], SN: ['S', 'N'], TF: ['T', 'F'], JP: ['J', 'P'] } as const;

/** Ответить на все утверждения в пользу перечисленных букв. */
function answersFor(poles: string[], value = 2): CareerAnswers {
  const answers: CareerAnswers = {};
  for (const statement of CAREER_STATEMENTS) {
    answers[statement.id] = poles.includes(statement.pole) ? value : -value;
  }
  return answers;
}

function main() {
  /* ---------- 1. банк утверждений ---------- */

  assert.equal(CAREER_STATEMENTS.length, 40, 'в банке ровно 40 утверждений');
  assert.equal(new Set(CAREER_STATEMENTS.map((s) => s.id)).size, CAREER_STATEMENTS.length, 'id уникальны');
  assert.equal(new Set(CAREER_STATEMENTS.map((s) => s.text)).size, CAREER_STATEMENTS.length, 'формулировки не повторяются');

  for (const axis of CAREER_AXES) {
    const onAxis = CAREER_STATEMENTS.filter((statement) => statement.axis === axis);
    assert.equal(onAxis.length, 10, `${axis}: 10 утверждений`);
    const [positive, negative] = POLE_PAIRS[axis];
    const forPositive = onAxis.filter((statement) => statement.pole === positive).length;
    const forNegative = onAxis.filter((statement) => statement.pole === negative).length;
    assert.equal(forPositive, 5, `${axis}: 5 утверждений за ${positive}`);
    assert.equal(forNegative, 5, `${axis}: 5 утверждений за ${negative}`);
    assert(CAREER_AXIS_LABELS[axis].positive && CAREER_AXIS_LABELS[axis].negative, `${axis}: подписи шкалы на месте`);
  }

  const scaleValues = CAREER_ANSWERS.map((answer) => answer.value);
  assert.deepEqual(scaleValues, [2, 1, 0, -1, -2], 'шкала ответов симметрична и включает нейтральный ответ');

  /* ---------- 2. профили ---------- */

  assert.equal(CAREER_CODES.length, 16, '16 профилей');
  for (const code of CAREER_CODES) {
    const profile = CAREER_PROFILES[code];
    assert.equal(profile.code, code, `${code}: код совпадает с ключом`);
    assert(isCareerCode(code) && getCareerProfile(code), `${code}: находится по коду`);
    assert.equal(code.length, 4, `${code}: четыре буквы`);
    for (const [index, axis] of CAREER_AXES.entries()) {
      assert(POLE_PAIRS[axis].includes(code[index] as never), `${code}: буква ${index + 1} принадлежит шкале ${axis}`);
    }
    assert(profile.name && profile.archetype && profile.summary, `${code}: имя, архетип и описание заполнены`);
    assert(profile.strengths.length >= 3, `${code}: минимум три сильные стороны`);
    assert(profile.growth.length >= 2, `${code}: минимум две зоны роста`);
    for (const field of ['decisions', 'study', 'examHint', 'format'] as const) {
      assert(profile[field].trim().length > 20, `${code}: поле ${field} не заглушка`);
    }
  }

  /* ---------- 3. профессии ---------- */

  const sphereIds = new Set(CAREER_SPHERES.map((sphere) => sphere.id));
  assert.equal(new Set(CAREER_PROFESSIONS.map((p) => p.id)).size, CAREER_PROFESSIONS.length, 'id профессий уникальны');
  assert.equal(new Set(CAREER_PROFESSIONS.map((p) => p.title)).size, CAREER_PROFESSIONS.length, 'названия профессий не дублируются');
  for (const profession of CAREER_PROFESSIONS) {
    assert(sphereIds.has(profession.sphere), `${profession.title}: известная сфера`);
    assert(profession.why.trim().length > 20, `${profession.title}: есть пояснение «почему»`);
    assert(profession.codes.length > 0, `${profession.title}: указан хотя бы один профиль`);
    assert.equal(new Set(profession.codes).size, profession.codes.length, `${profession.title}: профили не повторяются`);
    for (const code of profession.codes) {
      assert(isCareerCode(code), `${profession.title}: неизвестный профиль ${code}`);
    }
  }
  for (const sphere of CAREER_SPHERES) {
    assert(CAREER_PROFESSIONS.some((p) => p.sphere === sphere.id), `сфера ${sphere.id} не пустая`);
    assert(sphere.focus.trim().length > 20, `сфера ${sphere.id}: есть пояснение по навыкам`);
  }

  // Ни один профиль не должен получить отписку вместо выдачи.
  for (const code of CAREER_CODES) {
    const ranked = rankProfessions(code);
    const primary = CAREER_PROFESSIONS.filter((p) => p.codes[0] === code);
    assert(primary.length >= 3, `${code}: минимум 3 прямых попадания, сейчас ${primary.length}`);
    assert(ranked.length >= 8, `${code}: минимум 8 совпадений всего, сейчас ${ranked.length}`);

    const matches = matchProfessions(code);
    assert.equal(matches.top.length, 3, `${code}: топ-3 заполнен`);
    assert.equal(matches.total, ranked.length, `${code}: счётчик совпадений совпадает с выдачей`);
    const inGroups = matches.bySphere.flatMap((group) => group.items.map((item) => item.id));
    const topIds = matches.top.map((item) => item.id);
    assert.equal(new Set([...topIds, ...inGroups]).size, ranked.length, `${code}: профессия не дублируется в топе и в сферах`);
    assert(matches.top.every((item) => item.codes[0] === code), `${code}: в топе только прямые попадания`);
  }

  /* ---------- 4. подсчёт ---------- */

  assert.equal(scoreCareer(answersFor(['E', 'S', 'T', 'J'])).code, 'ESTJ', 'согласие с E/S/T/J даёт ESTJ');
  assert.equal(scoreCareer(answersFor(['I', 'N', 'F', 'P'])).code, 'INFP', 'согласие с I/N/F/P даёт INFP');
  // Несогласие работает наравне с согласием — иначе половина банка была бы мёртвой.
  assert.equal(scoreCareer(answersFor(['E', 'S', 'T', 'J'], -2)).code, 'INFP', 'зеркальные ответы дают зеркальный код');

  const decisive = scoreCareer(answersFor(['I', 'N', 'T', 'J']));
  assert.equal(decisive.decisiveAnswers, 40, 'все ответы засчитаны как осознанные');
  assert(decisive.axes.every((axis) => axis.strength === 100 && !axis.balanced), 'единодушные ответы дают 100 % по каждой шкале');
  assert.equal(decisive.neighbourCode, null, 'у однозначного результата нет соседнего профиля');

  // Сбалансированный банк: если соглашаться со всем подряд, уверенного профиля не будет.
  const yesToEverything: CareerAnswers = {};
  for (const statement of CAREER_STATEMENTS) yesToEverything[statement.id] = 2;
  const agreeable = scoreCareer(yesToEverything);
  assert(
    agreeable.axes.every((axis) => axis.strength === 50 && axis.balanced),
    'сплошное «да» не должно давать перевес ни по одной шкале',
  );

  const neutral = scoreCareer({});
  assert.equal(neutral.decisiveAnswers, 0, 'пустые ответы не считаются осознанными');
  assert(neutral.axes.every((axis) => axis.strength === 50 && axis.balanced), 'ровный ноль честно помечен как равновесие');
  assert(isCareerCode(neutral.code), 'даже при нулях выдаётся валидный код, а не пустая строка');
  assert(neutral.neighbourCode && neutral.neighbourCode !== neutral.code, 'при равновесии предлагается соседний профиль');

  // Одна шаткая шкала: сосед отличается ровно одной буквой — именно ею.
  const wobbly = answersFor(['I', 'N', 'T', 'J']);
  for (const statement of CAREER_STATEMENTS.filter((s) => s.axis === 'TF')) wobbly[statement.id] = 0;
  const wobblyResult = scoreCareer(wobbly);
  const tf = wobblyResult.axes.find((axis) => axis.axis === 'TF');
  assert(tf && tf.balanced && tf.strength <= BALANCED_STRENGTH, 'обнулённая шкала помечена как равновесная');
  assert.equal(wobblyResult.neighbourCode?.length, 4, 'соседний код тоже четырёхбуквенный');
  const differing = [...wobblyResult.code].filter((letter, i) => letter !== wobblyResult.neighbourCode?.[i]);
  assert.equal(differing.length, 1, 'сосед отличается ровно одной буквой');
  assert(POLE_PAIRS.TF.includes(differing[0] as never), 'отличается именно шаткая шкала');

  // Значения вне диапазона не должны перекашивать результат.
  const tampered: CareerAnswers = { ...answersFor(['E', 'S', 'T', 'J']) };
  tampered[CAREER_STATEMENTS[0].id] = 999;
  assert.equal(scoreCareer(tampered).code, 'ESTJ', 'значения вне шкалы обрезаются, а не ломают подсчёт');

  // Детерминированность: одинаковый ввод — одинаковая выдача.
  const first = matchProfessions('INTJ').top.map((item) => item.id);
  const second = matchProfessions('INTJ').top.map((item) => item.id);
  assert.deepEqual(first, second, 'выдача профессий стабильна между вызовами');

  console.log(
    `PASS career unit: банк ${CAREER_STATEMENTS.length} утверждений, ${CAREER_CODES.length} профилей, ` +
      `${CAREER_PROFESSIONS.length} профессий в ${CAREER_SPHERES.length} сферах`,
  );
}

main();
