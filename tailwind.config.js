/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class', // Enable class-based dark mode
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        strava: {
          orange: '#FC4C02',
        },
        palette: {
          light: '#FBDB93',
          medium: '#BE5B50',
          dark: '#8A2D3B',
          darkest: '#641B2E',
        },
      },
    },
  },
  plugins: [],
}

