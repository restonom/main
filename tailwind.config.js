/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#42b983',
        'primary-light': '#65d5a8',
        'primary-dark': '#2a9d6a',
        secondary: '#8b5cf6',
        'secondary-light': '#a78bfa',
        'secondary-dark': '#7c3aed',
      },
    },
  },
  plugins: [],
} 