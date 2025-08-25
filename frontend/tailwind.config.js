/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: { 'ink': '#0b0b0c', 'card': '#151517', 'muted': '#8b8d97' }
    },
  },
  plugins: [],
};
