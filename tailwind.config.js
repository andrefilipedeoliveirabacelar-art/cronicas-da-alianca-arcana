/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        tavern: {
          dark: '#120D1A',
          wood: '#1A1423',
          woodLight: '#2D1F3D',
          woodBorder: '#442F5C',
          gold: '#F59E0B',
          goldLight: '#FBBF24',
          goldDark: '#B45309',
        },
        hero: {
          fighter: '#EF4444',
          wizard: '#8B5CF6',
          thief: '#3B82F6',
          guardian: '#F59E0B',
          ranger: '#10B981',
          bard: '#EC4899',
        },
        card: {
          spell: '#06B6D4',
          item: '#94A3B8',
          modifier: '#F43F5E',
          monster: '#0F172A',
          monsterFlame: '#F97316',
          attackable: '#22C55E',
        },
        pa: {
          crystal: '#38BDF8',
          crystalGlow: '#0284C7',
        }
      },
      fontFamily: {
        cinzel: ['"Cinzel"', 'serif'],
        inter: ['"Inter"', 'sans-serif'],
      },
      boxShadow: {
        'tavern-glow': '0 0 25px -3px rgba(245, 158, 11, 0.35)',
        'monster-flame': '0 0 20px 2px rgba(249, 115, 22, 0.45)',
        'attackable-glow': '0 0 15px 3px rgba(34, 197, 94, 0.6)',
        'bluff-glow': '0 0 18px 2px rgba(236, 72, 153, 0.5)',
        'dice-glow': '0 0 25px 4px rgba(251, 191, 36, 0.5)',
        'card-lift': '0 12px 28px -6px rgba(0, 0, 0, 0.75)',
      },
      animation: {
        'pulse-fast': 'pulse 1.2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'shake': 'screenShake 0.4s cubic-bezier(.36,.07,.19,.97) both',
        'dice-roll': 'diceRollAnim 0.7s cubic-bezier(0.25, 1, 0.5, 1) forwards',
        'pop': 'popIn 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards',
      },
      keyframes: {
        screenShake: {
          '10%, 90%': { transform: 'translate3d(-2px, 0, 0)' },
          '20%, 80%': { transform: 'translate3d(3px, 0, 0)' },
          '30%, 50%, 70%': { transform: 'translate3d(-4px, 0, 0)' },
          '40%, 60%': { transform: 'translate3d(4px, 0, 0)' },
        },
        diceRollAnim: {
          '0%': { transform: 'scale(0.5) rotate(-180deg)', opacity: '0.3' },
          '60%': { transform: 'scale(1.15) rotate(20deg)', opacity: '1' },
          '100%': { transform: 'scale(1) rotate(0deg)', opacity: '1' },
        },
        popIn: {
          '0%': { transform: 'scale(0.85)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        }
      }
    },
  },
  plugins: [],
}
