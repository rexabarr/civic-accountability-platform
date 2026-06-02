import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        civic: {
          blue: '#1a3a6b',
          red: '#b22222',
          gold: '#c8a415',
        },
      },
    },
  },
  plugins: [],
};

export default config;
