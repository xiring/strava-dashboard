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
          orange: '#F49B00',
        },
        palette: {
          light: '#F8CB74',    // light amber (bottom stripe)
          medium: '#F49B00',   // vibrant amber (third stripe)
          dark: '#A86E1E',     // warm brown-orange (second stripe)
          darkest: '#7B5632',  // deep brown (top stripe)
        },
      },
    },
  },
  plugins: [],
}

