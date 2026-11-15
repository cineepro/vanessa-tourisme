/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Vert du drapeau beninois : couleur principale (600 = #008751)
        primary: {
          50: '#eefbf3',
          100: '#d6f5e3',
          200: '#b0eaca',
          300: '#7cd9ab',
          400: '#45c188',
          500: '#1fa56b',
          600: '#008751',
          700: '#006e44',
          800: '#085639',
          900: '#084730',
          950: '#032919',
        },
        // Jaune du drapeau : accent (400 = #FCD116)
        accent: {
          50: '#fffce8',
          100: '#fff8c2',
          200: '#ffee88',
          300: '#ffe047',
          400: '#fcd116',
          500: '#e3b705',
          600: '#c38d02',
          700: '#9b6606',
          800: '#81500c',
          900: '#6d420f',
        },
        // Rouge du drapeau : alertes et urgences (600 = #E8112D)
        danger: {
          50: '#fef2f2',
          100: '#fee2e2',
          200: '#fecaca',
          300: '#fca5a5',
          400: '#f87171',
          500: '#ef4444',
          600: '#e8112d',
          700: '#c00d24',
          800: '#9f1126',
          900: '#841528',
        },
        // Neutres chauds (terre / sable) pour les fonds et les textes
        sable: {
          50: '#faf8f4',
          100: '#f3efe6',
          200: '#e6dfd0',
          300: '#d3c8b3',
          400: '#b8a98e',
          500: '#9c8c70',
          600: '#7f7159',
          700: '#665a49',
          800: '#4a4236',
          900: '#2b261f',
        },
      },
      fontFamily: {
        display: [
          '"Bricolage Grotesque Variable"',
          'ui-sans-serif',
          'system-ui',
          'sans-serif',
        ],
        sans: [
          '"Figtree Variable"',
          'ui-sans-serif',
          'system-ui',
          '-apple-system',
          'Segoe UI',
          'sans-serif',
        ],
      },
      boxShadow: {
        card: '0 1px 2px rgba(43, 38, 31, 0.06), 0 8px 24px rgba(43, 38, 31, 0.08)',
        lift: '0 4px 6px rgba(43, 38, 31, 0.07), 0 18px 40px rgba(43, 38, 31, 0.14)',
      },
      borderRadius: {
        '4xl': '2rem',
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'typing-dot': {
          '0%, 80%, 100%': { opacity: '0.25', transform: 'translateY(0)' },
          '40%': { opacity: '1', transform: 'translateY(-3px)' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.4s ease-out both',
        'fade-in': 'fade-in 0.3s ease-out both',
        'typing-dot': 'typing-dot 1.2s infinite ease-in-out',
      },
    },
  },
  plugins: [],
}