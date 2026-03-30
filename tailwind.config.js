/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      fontFamily: {
        serif: ['var(--font-cormorant)', 'Georgia', 'serif'],
        sans: ['var(--font-outfit)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-dm-mono)', 'monospace'],
      },
      colors: {
        cream: '#F5F1E8',
        parchment: '#EDE8DB',
        ink: {
          DEFAULT: '#1A1612',
          2: '#2E2820',
        },
        muted: '#7A7268',
        gold: {
          DEFAULT: '#C4963A',
          dark: '#8B6914',
        },
        surface: '#FDFBF7',
      },
      borderRadius: {
        DEFAULT: '4px',
      },
    },
  },
  plugins: [],
};
