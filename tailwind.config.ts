import type { Config } from 'tailwindcss';

/**
 * Имена палитры v2 (paper/ink/red/line) — API старых компонентов; значения
 * приходят только из токенов v3 (design/tokens.css) через globals.css.
 * UI не хардкодит цвета — только токены; проверка: scripts/token-audit.ts.
 */
const config: Config = {
  content: ['./src/**/*.{ts,tsx,mdx}'],
  theme: {
    extend: {
      /* RGB-каналы живут в globals.css (--c-*), чтобы работали
         opacity-модификаторы (bg-ink/60, text-paper/70). */
      colors: {
        paper: {
          DEFAULT: 'rgb(var(--c-paper) / <alpha-value>)',
          deep: 'rgb(var(--c-paper-deep) / <alpha-value>)',
          card: 'rgb(var(--c-paper-card) / <alpha-value>)',
        },
        ink: {
          DEFAULT: 'rgb(var(--c-ink) / <alpha-value>)',
          soft: 'rgb(var(--c-ink-soft) / <alpha-value>)',
          faint: 'rgb(var(--c-ink-faint) / <alpha-value>)',
          invert: 'rgb(var(--c-ink-invert) / <alpha-value>)',
        },
        red: {
          DEFAULT: 'rgb(var(--c-red) / <alpha-value>)',
          deep: 'rgb(var(--c-red-deep) / <alpha-value>)',
          wash: 'rgb(var(--c-red-wash) / <alpha-value>)',
        },
        line: {
          DEFAULT: 'rgb(var(--c-line) / <alpha-value>)',
          strong: 'rgb(var(--c-line-strong) / <alpha-value>)',
        },
        success: {
          DEFAULT: 'var(--success)',
          soft: 'var(--success-soft)',
        },
      },
      borderRadius: {
        md: 'var(--r-md)',
        lg: 'var(--r-lg)',
      },
      fontFamily: {
        display: ['var(--font-display)', 'Arial Narrow', 'Helvetica Neue', 'sans-serif'],
        serif: ['var(--font-serif)', 'Georgia', 'Times New Roman', 'serif'],
        ui: ['var(--font-ui)', 'Helvetica Neue', 'Arial', 'sans-serif'],
        hand: ['var(--font-hand)', 'Segoe Script', 'cursive'],
        mono: ['var(--font-mono)', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      fontSize: {
        display: ['var(--fs-display, clamp(2.9rem, 12vw, 7rem))', { lineHeight: 'var(--lh-display, 0.92)', letterSpacing: '0.005em' }],
        h1: ['clamp(2rem, 8vw, 4rem)', { lineHeight: 'var(--lh-heading, 1.02)', letterSpacing: '-0.015em' }],
        h2: ['clamp(1.5rem, 5.6vw, 2.6rem)', { lineHeight: 'var(--lh-heading, 1.02)', letterSpacing: '0em' }],
        h3: ['clamp(1.15rem, 4vw, 1.5rem)', { lineHeight: '1.1' }],
        body: ['1.0625rem', { lineHeight: '1.55' }],
        micro: ['0.6875rem', { lineHeight: '1.25', letterSpacing: '0.14em' }],
      },
      boxShadow: {
        block: '6px 6px 0 0 var(--ink)',
        'block-sm': '3px 3px 0 0 var(--ink)',
        'block-red': '6px 6px 0 0 var(--red)',
        card: 'var(--shadow-card)',
      },
      maxWidth: {
        sheet: '44rem',
        wide: '68rem',
      },
      transitionTimingFunction: {
        out: 'cubic-bezier(0.2, 0.7, 0.2, 1)',
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'bar-grow': {
          '0%': { transform: 'scaleX(0)' },
          '100%': { transform: 'scaleX(1)' },
        },
        pop: {
          '0%': { opacity: '0', transform: 'scale(0.96)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
      },
      animation: {
        'fade-up': 'fade-up 240ms cubic-bezier(0.2, 0.7, 0.2, 1) both',
        'bar-grow': 'bar-grow 600ms cubic-bezier(0.2, 0.7, 0.2, 1) both',
        pop: 'pop 180ms cubic-bezier(0.2, 0.7, 0.2, 1) both',
      },
    },
  },
  plugins: [],
};

export default config;
