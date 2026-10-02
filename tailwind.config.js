/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx}',
    './components/**/*.{js,jsx}',
  ],
  theme: {
    extend: {
      colors: {
        ink: '#140F2B',
        surface: '#1F1840',
        'surface-2': '#2A2153',
        amber: '#F4A93B',
        teal: '#2BC7B8',
        coral: '#F2542D',
        cream: '#F6F0E4',
        muted: '#B8AFD9',
      },
      fontFamily: {
        display: ['var(--font-display)', 'sans-serif'],
        body: ['var(--font-body)', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
