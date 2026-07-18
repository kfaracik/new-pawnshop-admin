/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#C9A227',
        gold: {
          light: '#E1C76A',
          DEFAULT: '#C9A227',
          dark: '#8E7213',
          soft: '#FFF8E8',
        },
        ink: '#0F0F0F',
        highlight: '#FFF8E8',
        bgGray: '#f7f7f7',
      },
      fontFamily: {
        sans: ['Poppins', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
