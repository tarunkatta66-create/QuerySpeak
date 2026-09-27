import plugin from 'tailwindcss/plugin';

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: 'var(--color-background, #FAF8F3)',
        surface: 'var(--color-surface, #FFFFFF)',
        border: 'var(--color-border, #EAE3D3)',
        ink: 'var(--color-ink, #14213D)',
        muted: '#6B6456',
        accentCoral: '#FF6B4A',
        accentTeal: '#16A394',
        success: '#2E8B57',
        error: '#D64550',
        darkBackground: '#1B1024',
        darkSurface: '#241531',
        darkInk: '#F4E9FF',
      },
      fontFamily: {
        display: ['Fraunces', 'serif'],
        sans: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
    },
  },
  plugins: [
    plugin(function ({ addUtilities }) {
      addUtilities({
        '.bg-grain': {
          'background-image': `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.03'/%3E%3C/svg%3E")`,
        },
      });
    }),
  ],
}
