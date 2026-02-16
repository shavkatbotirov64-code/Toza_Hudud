/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: '#1E3A8A',
        secondary: '#10B981',
        accent: '#06B6D4',
      },
      backgroundImage: {
        'cyber-gradient':
          'radial-gradient(circle at top, rgba(56,189,248,0.25), transparent 55%), radial-gradient(circle at bottom, rgba(14,116,144,0.4), #020617)',
      },
      boxShadow: {
        'glow-blue': '0 0 30px rgba(56,189,248,0.45)',
        'glow-green': '0 0 30px rgba(16,185,129,0.45)',
      },
    },
  },
  plugins: [],
}







