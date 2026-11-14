/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      // Brand palette — deep Bangladesh-green primary with amber accent
      colors: {
        brand: {
          50: '#ecfdf5',
          100: '#d1fae5',
          200: '#a7f3d0',
          300: '#6ee7b7',
          400: '#34d399',
          500: '#10b981',
          600: '#059669',
          700: '#047857',
          800: '#065f46',
          900: '#064e3b',
          950: '#022c22',
        },
        accent: {
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
          800: '#92400e',
          900: '#78350f',
          950: '#451a03',
        },
        success: '#16a34a',
        warning: '#d97706',
        danger: '#e11d48',
        info: '#0284c7',
      },
      fontFamily: {
        // Latin-first stack: Inter renders English, Hind Siliguri covers Bangla glyphs
        sans: [
          'Inter',
          'Hind Siliguri',
          'Noto Sans Bengali',
          'ui-sans-serif',
          'system-ui',
          'sans-serif',
        ],
        // Bangla-first stack used when UI language is Bangla
        bangla: ['Hind Siliguri', 'Noto Sans Bengali', 'Inter', 'sans-serif'],
      },
      spacing: {
        18: '4.5rem',
        22: '5.5rem',
      },
      boxShadow: {
        card: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
        'card-hover': '0 12px 32px -12px rgb(2 44 34 / 0.25)',
      },
      keyframes: {
        'typing-dot': {
          '0%, 60%, 100%': { transform: 'translateY(0px)', opacity: '0.4' },
          '30%': { transform: 'translateY(-4px)', opacity: '1' },
        },
        'fade-in': {
          from: { opacity: '0', transform: 'translateY(4px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-up': {
          from: { opacity: '0', transform: 'translateY(12px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in-up': {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'pop-in': {
          '0%': { opacity: '0', transform: 'scale(0.92)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        'drift-x': {
          '0%, 100%': { transform: 'translateX(0) scale(1)' },
          '50%': { transform: 'translateX(18px) scale(1.08)' },
        },
        'drift-y': {
          '0%, 100%': { transform: 'translateY(0) scale(1)' },
          '50%': { transform: 'translateY(16px) scale(1.06)' },
        },
      },
      animation: {
        'typing-dot': 'typing-dot 1.2s ease-in-out infinite',
        'fade-in': 'fade-in 0.3s ease-out',
        'slide-up': 'slide-up 0.4s ease-out',
        'fade-in-up': 'fade-in-up 0.6s cubic-bezier(0.22, 1, 0.36, 1) both',
        'pop-in': 'pop-in 0.45s cubic-bezier(0.22, 1, 0.36, 1) both',
        float: 'float 6s ease-in-out infinite',
        'drift-x': 'drift-x 14s ease-in-out infinite',
        'drift-y': 'drift-y 18s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
