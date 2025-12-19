/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {

    extend: {
      colors: {
        'paper': '#F8FAFC', // Slate-50: Cool white
        'oxford-blue': '#172554', // Blue-950: Deep primary blue
        'bronze': '#2563EB', // Blue-600: Bright action blue (replacing bronze)
      },
      fontFamily: {
        serif: ['"Inter"', 'sans-serif'], // Remapped to sans for modern look
        sans: ['"Inter"', 'sans-serif'],
      },
    },

  },
  plugins: [],
}

