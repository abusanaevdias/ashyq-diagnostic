import type { Config } from 'tailwindcss';

/**
 * ASHYQ design tokens — v2.
 * Цвета сняты с оригинальных brand-ассетов (см. docs/DESIGN.md):
 * cream #F7F3EA, brand red #CE1E23, warm ink #211A16.
 * UI не хардкодит цвета — только токены отсюда.
 */
const config: Config = {
  content: ['./src/**/*.{ts,tsx,mdx}'],
  theme: {
    extend: {
      /* Каналы продублированы из globals.css в RGB, чтобы работали
         opacity-модификаторы (bg-ink/60, text-paper/70 и т.д.).
         Менять палитру — в обоих местах сразу. */
      colors: {
        paper: {
          DEFAULT: 'rgb(247 243 234 / <alpha-value>)',
          deep: 'rgb(237 231 218 / <alpha-value>)',
          card: 'rgb(252 250 244 / <alpha-value>)',
        },
        ink: {
          DEFAULT: 'rgb(33 26 22 / <alpha-value>)',
          soft: 'rgb(95 85 75 / <alpha-value>)',
          faint: 'rgb(140 129 119 / <alpha-value>)',
          invert: 'rgb(251 248 241 / <alpha-value>)',
        },
        red: {
          DEFAULT: 'rgb(206 30 35 / <alpha-value>)',
          deep: 'rgb(168 20 24 / <alpha-value>)',
          wash: 'rgb(246 227 223 / <alpha-value>)',
        },
        line: {
          DEFAULT: 'rgb(224 216 200 / <alpha-value>)',
          strong: 'rgb(33 26 22 / <alpha-value>)',
        },
      },
      fontFamily: {
        display: ['var(--font-display)', 'Arial Narrow', 'Helvetica Neue', 'sans-serif'],
        serif: ['var(--font-serif)', 'Georgia', 'Times New Roman', 'serif'],
        ui: ['var(--font-ui)', 'Helvetica Neue', 'Arial', 'sans-serif'],
        hand: ['var(--font-hand)', 'Segoe Script', 'cursive'],
        mono: ['var(--font-mono)', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      fontSize: {
        display: ['clamp(2.9rem, 12vw, 7rem)', { lineHeight: '0.92', letterSpacing: '0.005em' }],
        h1: ['clamp(2rem, 8vw, 4rem)', { lineHeight: '1.02', letterSpacing: '-0.015em' }],
        h2: ['clamp(1.5rem, 5.6vw, 2.6rem)', { lineHeight: '1.02', letterSpacing: '0em' }],
        h3: ['clamp(1.15rem, 4vw, 1.5rem)', { lineHeight: '1.1' }],
        body: ['1.0625rem', { lineHeight: '1.55' }],
        micro: ['0.6875rem', { lineHeight: '1.25', letterSpacing: '0.14em' }],
      },
      boxShadow: {
        block: '6px 6px 0 0 var(--ink)',
        'block-sm': '3px 3px 0 0 var(--ink)',
        'block-red': '6px 6px 0 0 var(--red)',
        card: '0 1px 2px rgba(33,26,22,0.05), 0 14px 34px -22px rgba(33,26,22,0.28)',
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
