/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './components/**/*.{js,jsx,ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        primary: '#4A6FE3',
        secondary: '#F5A623',
        coral: '#FF6B6B',
        mint: '#4ECDC4',
        background: '#F8F9FD',
        card: '#FFFFFF',
        textPrimary: '#1A1A2E',
        textSecondary: '#8E8E93',
        border: '#E5E7EB',
        peach: '#FFD6C0',
      },
    },
  },
  plugins: [],
};
