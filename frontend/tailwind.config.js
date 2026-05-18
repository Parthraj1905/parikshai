/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      colors: {
        background: 'var(--bg-base)',
        foreground: 'var(--text-strong)',
        white: 'var(--bg-base)',
        black: 'var(--invert)',
        gray: {
          50: 'var(--bg-subtle)',
          100: 'var(--border-light)',
          200: 'var(--border-medium)',
          300: 'var(--border-heavy)',
          400: 'var(--text-muted)',
          500: 'var(--text-subtle)',
          600: 'var(--text-medium)',
          700: 'var(--gray-700)',
          800: 'var(--gray-800)',
          900: 'var(--text-strong)',
          950: 'var(--gray-950)',
        },
        green: {
          50: 'var(--c-grn-bg)',
          500: 'var(--c-grn-bor)',
          600: 'var(--c-grn-txt)',
          900: 'var(--c-grn-inv)',
        },
        red: {
          50: 'var(--c-red-bg)',
          500: 'var(--c-red-bor)',
          600: 'var(--c-red-txt)',
          900: 'var(--c-red-inv)',
        }
      }
    },
  },
  plugins: [],
}