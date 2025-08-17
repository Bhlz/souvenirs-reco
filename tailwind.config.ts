import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: { DEFAULT: '#0ea5e9', dark: '#0369a1' },
        accent: '#f59e0b',
      },
      boxShadow: { soft: '0 8px 30px rgba(0,0,0,0.06)' }
    },
  },
  plugins: [],
};
export default config;
