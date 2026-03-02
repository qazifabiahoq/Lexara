/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: {
          primary: '#0A1628',
          secondary: '#112240',
        },
        gold: {
          DEFAULT: '#C9A84C',
        },
        gray: {
          muted: '#8892B0',
        },
        risk: {
          high: '#EF4444',
          medium: '#F59E0B',
          low: '#10B981',
        },
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
