/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#fffbee",
          100: "#fff3cc",
          200: "#ffe699",
          300: "#ffd966",
          400: "#ffc700",
          500: "#ffb400", // yellow الأساسي
          600: "#e6a300",
          700: "#b37a00", // بني
          800: "#7a5200",
          900: "#3d2900"
        },
        blackish: "#0b0b0b", // أسود غامق عصري
        white: "#ffffff"
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui']
      }
    }
  },
  plugins: []
};
