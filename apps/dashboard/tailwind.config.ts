import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#E8F1FF',
          100: '#D0E3FF',
          200: '#A1C8FF',
          300: '#61A3FF',
          400: '#2E7DFF',
          500: '#0F62FE',  // Main brand color
          600: '#0043CE',
          700: '#0033A0',
          800: '#002673',
          900: '#001A46',
        },
        risk: {
          green: {
            50: '#E8F5E9',
            100: '#C8E6C9',
            500: '#007D32',
            600: '#006B2B',
            700: '#005A24',
          },
          yellow: {
            50: '#FFF8E1',
            100: '#FFECB3',
            500: '#B96B00',
            600: '#A05C00',
            700: '#874D00',
          },
          red: {
            50: '#FDEDEC',
            100: '#F9BDBC',
            500: '#DA1E28',
            600: '#C01A22',
            700: '#A6161D',
          },
        },
        // Semantic colors for dark/light mode
        bg: {
          primary: 'var(--color-bg-primary)',
          secondary: 'var(--color-bg-secondary)',
          tertiary: 'var(--color-bg-tertiary)',
        },
        text: {
          primary: 'var(--color-text-primary)',
          secondary: 'var(--color-text-secondary)',
          muted: 'var(--color-text-muted)',
        },
        border: {
          subtle: 'var(--color-border-subtle)',
          default: 'var(--color-border-default)',
          strong: 'var(--color-border-strong)',
        },
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'monospace'],
      },
      fontSize: {
        'xs': ['0.75rem', { lineHeight: '1.5' }],
        'sm': ['0.875rem', { lineHeight: '1.5' }],
        'base': ['1rem', { lineHeight: '1.5' }],
        'lg': ['1.125rem', { lineHeight: '1.5' }],
        'xl': ['1.25rem', { lineHeight: '1.25' }],
        '2xl': ['1.5rem', { lineHeight: '1.25' }],
        '3xl': ['1.875rem', { lineHeight: '1.25' }],
        '4xl': ['2.25rem', { lineHeight: '1.25' }],
      },
      spacing: {
        '1': '0.25rem',
        '2': '0.5rem',
        '3': '0.75rem',
        '4': '1rem',
        '5': '1.25rem',
        '6': '1.5rem',
        '8': '2rem',
        '10': '2.5rem',
        '12': '3rem',
        '16': '4rem',
      },
      borderRadius: {
        'sm': '4px',
        'md': '8px',
        'lg': '12px',
        'xl': '16px',
      },
      boxShadow: {
        'sm': '0 1px 2px rgba(0,0,0,0.04)',
        'md': '0 4px 8px rgba(0,0,0,0.08)',
        'lg': '0 8px 24px rgba(0,0,0,0.12)',
      },
      transitionDuration: {
        'fast': '150ms',
        'normal': '200ms',
      },
    },
  },
  plugins: [],
};

export default config;