/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Brand colors from approved design
        orange: '#B85C1A',
        gold: '#F5A623',
        teal: '#156B60',
        'light-gold': '#FDB750',
        'dark-orange': '#8F4814',
        // Backgrounds
        cream: '#FAF5F0',
        'map-bg': '#E8DED0',
        // Text
        'text-primary': '#2D1810',
        'text-secondary': '#8B7968',
        border: '#E8DED0',
        disabled: '#C4B5A6',
      },
      fontFamily: {
        sans: ['Poppins', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        secondary: ['Montserrat', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
