/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        fantasy: {
          dark: '#0B0F19',
          surface: '#131B2E',
          surfaceLight: '#1E293B',
          gold: '#F59E0B',
          goldLight: '#FBBF24',
          goldDark: '#B45309',
          arcane: '#8B5CF6',
          arcaneLight: '#A78BFA',
          crimson: '#EF4444',
          emerald: '#10B981',
          cyan: '#06B6D4'
        }
      },
      fontFamily: {
        cinzel: ['"Cinzel"', 'serif'],
        inter: ['"Inter"', 'sans-serif'],
      },
      boxShadow: {
        'arcane-glow': '0 0 25px -5px rgba(139, 92, 246, 0.4)',
        'gold-glow': '0 0 25px -5px rgba(245, 158, 11, 0.4)',
        'crimson-glow': '0 0 25px -5px rgba(239, 68, 68, 0.5)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 3s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-6px)' },
        }
      }
    },
  },
  plugins: [],
}
