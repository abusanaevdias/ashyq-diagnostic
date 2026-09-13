# Accessibility and performance gate

`npm run check:a11y-perf` проверяет все публичные маршруты из
`scripts/a11y-perf-check.ts` против уже запущенного production-сервера.

Проверки:

- axe-core: WCAG 2 A/AA и WCAG 2.1 A/AA;
- desktop 1440 px и mobile 390 px без горизонтального overflow;
- видимые кнопки, поля и самостоятельные ссылки не меньше 44×44 px;
- клавиатурный фокус видим на всех доступных элементах маршрута (защитный
  предел — 80 Tab-переходов);
- при `prefers-reduced-motion: reduce` нет активных transition/animation;
- Lighthouse desktop: Performance не ниже 90, Accessibility не ниже 95;
- LCP и CLS записываются в отчёт для диагностики.

Inline-ссылки внутри текста исключены из проверки 44×44 по исключению WCAG
2.5.8 для целей в строке текста. Axe продолжает проверять их имя, контраст и
семантику.

## Локальный запуск

```powershell
$env:NEXT_PUBLIC_SITE_URL="https://ashyq.example"
npm run build
npx next start -H 127.0.0.1 -p 3026

$env:BASE_URL="http://127.0.0.1:3026"
npm run check:a11y-perf
```

JSON сохраняется в `artifacts/a11y-perf/`. Для временной диагностики порог
можно переопределить через `LIGHTHOUSE_PERFORMANCE_MIN`, но CI всегда использует
значение по умолчанию `0.9`. Lighthouse Accessibility имеет порог `0.95`, а
строгий WCAG A/AA gate обеспечивается axe без допустимых нарушений.
