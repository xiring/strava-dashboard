/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        strava: {
          DEFAULT: '#FC4C02',
          hover: '#e64502',
          muted: '#ff6b2e',
        },
        palette: {
          light: '#FC4C02',
          medium: '#e64502',
          dark: '#c93d02',
          darkest: '#0f172a',
        },
      },
      borderRadius: {
        'xl': '12px',
        '2xl': '16px',
        '3xl': '20px',
      },
      boxShadow: {
        'soft': '0 2px 8px -2px rgb(0 0 0 / 0.06), 0 4px 16px -4px rgb(0 0 0 / 0.04)',
        'soft-lg': '0 8px 32px -8px rgb(0 0 0 / 0.08), 0 4px 16px -4px rgb(0 0 0 / 0.04)',
        'glow': '0 0 20px -4px rgb(252 76 2 / 0.25)',
        'glass': '0 8px 32px -8px rgba(0,0,0,0.08), inset 0 1px 0 0 rgba(255,255,255,0.8)',
        'glass-lg': '0 12px 40px -12px rgba(0,0,0,0.1), inset 0 1px 0 0 rgba(255,255,255,0.9)',
      },
      backdropBlur: {
        xs: '2px',
        '3xl': '64px',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
      },
      keyframes: {
        fadeIn: { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        slideUp: { '0%': { opacity: '0', transform: 'translateY(8px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
      },
    },
  },
  plugins: [],
}

