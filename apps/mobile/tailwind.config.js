const preset = require('@roamera/config/tailwind');

/** @type {import('tailwindcss').Config} */
module.exports = {
  presets: [preset],
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
    '../../packages/ui/src/**/*.{js,ts,jsx,tsx}',
  ],
};
