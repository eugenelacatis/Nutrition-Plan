/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        cream: {
          50: 'rgb(var(--cream-50) / <alpha-value>)',
          100: 'rgb(var(--cream-100) / <alpha-value>)',
        },
        ink: {
          900: 'rgb(var(--ink-900) / <alpha-value>)',
        },
        ember: {
          500: 'rgb(var(--ember-500) / <alpha-value>)',
          700: 'rgb(var(--ember-700) / <alpha-value>)',
        },
        sage: {
          400: 'rgb(var(--sage-400) / <alpha-value>)',
          600: 'rgb(var(--sage-600) / <alpha-value>)',
        },
        gold: {
          400: 'rgb(var(--gold-400) / <alpha-value>)',
          700: 'rgb(var(--gold-700) / <alpha-value>)',
        },
        brick: {
          500: 'rgb(var(--brick-500) / <alpha-value>)',
          600: 'rgb(var(--brick-600) / <alpha-value>)',
        },
      },
      fontFamily: {
        display: ['var(--font-display)'],
        sans: ['var(--font-body)'],
      },
    },
  },
  plugins: [],
}
