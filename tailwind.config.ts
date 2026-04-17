import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      fontFamily: {
        lora: ['var(--font-lora)', 'Georgia', 'serif'],
        source: ['var(--font-source)', 'system-ui', 'sans-serif'],
      },
      colors: {
        cream: {
          50: '#FFFDF8',
          100: '#FFF3DC',
          200: '#F5ECD7',
        },
        amber: {
          50: '#FFFBF0',
          100: '#FFF3DC',
          200: '#EAD9B8',
          300: '#EAC98A',
          400: '#FAC775',
          500: '#EF9F27',
          600: '#BA7517',
          700: '#854F0B',
          800: '#633806',
          900: '#3C2008',
        },
      },
      borderRadius: {
        '2xl': '16px',
        '3xl': '24px',
      },
    },
  },
  plugins: [],
}

export default config;