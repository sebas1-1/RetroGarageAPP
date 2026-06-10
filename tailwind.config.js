/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/app/**/*.{js,jsx,ts,tsx}",
    "./src/components/**/*.{js,jsx,ts,tsx}"
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: "#2C2C2A",
        cream: "#F5F4F0",
        accent: "#D85A30",
        border: "#C8C6BC",
      },
    },
  },
  plugins: [],
};