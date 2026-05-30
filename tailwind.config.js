/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'sf-red':  '#e50914',
        'sf-dark': '#141414',
        'sf-card': '#1f1f1f',
      },
      fontFamily: {
        'bebas': ['"Bebas Neue"', 'cursive'],
      },
    },
  },
  plugins: [],
}
