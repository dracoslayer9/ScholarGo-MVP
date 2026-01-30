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
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        dash: {
          '0%': { strokeDashoffset: '100' },
          '100%': { strokeDashoffset: '0' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideIn: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        float: 'float 6s ease-in-out infinite',
        dash: 'dash 1.5s linear infinite',
        fadeIn: 'fadeIn 0.2s ease-out forwards',
        slideIn: 'slideIn 0.3s ease-out forwards',
      },
    },

  },
  plugins: [],
}

