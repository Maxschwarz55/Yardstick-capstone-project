/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      spacing: {
        xs: "4px", // extra small
        sm: "8px", // small
        sm2: "12px", // small + extra
        md: "16px", // medium
        md2: "20px", // medium + extra
        lg: "28px", // large
        lg2: "40px", // large + extra
        xl: "60px", // extra large
        xxl: "100px", // double extra large
        "3xl": "160px", // triple extra large
        "4xl": "240px", // quadruple extra large
      },
    },
  },
  plugins: [],
};
