/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Google Sans', 'Segoe UI', 'sans-serif'],
      },
    },
  },
  plugins: [],
}