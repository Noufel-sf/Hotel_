/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        navy: {
          950: '#0D1626',
          900: '#12213B',
          800: '#1A2E4F',
          700: '#233D66',
          600: '#2E4E80',
        },
        gold: {
          50: '#FBF5E6',
          100: '#F3E4B8',
          300: '#DDBB6E',
          400: '#C89B3C',
          500: '#B3862E',
          600: '#916B21',
        },
        paper: '#F7F8FA',
        ink: {
          900: '#171B24',
          700: '#3A4152',
          500: '#6B7280',
          300: '#9CA3AF',
        },
      },
      fontFamily: {
        display: ['"Fraunces"', 'serif'],
        body: ['"Inter"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      boxShadow: {
        soft: '0 2px 10px rgba(23, 27, 36, 0.06)',
        card: '0 4px 20px rgba(18, 33, 59, 0.08)',
        pop: '0 12px 40px rgba(18, 33, 59, 0.16)',
      },
      borderRadius: {
        xl2: '1.25rem',
      },
    },
  },
  plugins: [],
};
