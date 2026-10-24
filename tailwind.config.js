/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      colors: {
        // Eco-green theme: the app's accent scales (cyan / blue) are remapped
        // to fresh green / deep forest so every page picks up the new look.
        cyan: {
          50: '#effbf0',
          100: '#d9f6dc',
          200: '#b4ecba',
          300: '#82dd8b',
          400: '#4fca5b',
          500: '#2fb33c',
          600: '#22922e',
          700: '#1e7328',
          800: '#1c5b24',
          900: '#194b20',
          950: '#082a0e',
        },
        blue: {
          50: '#eef6f0',
          100: '#d5eadb',
          200: '#acd5b8',
          300: '#7bb98e',
          400: '#4f9a66',
          500: '#327d4b',
          600: '#1f6638',
          700: '#18512e',
          800: '#144126',
          900: '#10351f',
          950: '#081d11',
        },
        navy: {
          950: '#06120a',
          900: '#0b1a10',
          850: '#0f2216',
          800: '#132a1c',
          700: '#1b3a27',
          600: '#284f37',
        },
        canvas: '#eef2ee',
        accent: {
          DEFAULT: '#2fb33c',
          soft: '#d9f6dc',
          blue: '#1f6638',
        },
      },
      boxShadow: {
        card: '0 1px 2px rgba(16,40,24,.04), 0 8px 24px -14px rgba(16,40,24,.18)',
        glow: '0 0 0 1px rgba(47,179,60,.25), 0 12px 40px -12px rgba(47,179,60,.40)',
      },
      keyframes: {
        fadeUp: { '0%': { opacity: 0, transform: 'translateY(8px)' }, '100%': { opacity: 1, transform: 'none' } },
        shimmer: { '0%': { backgroundPosition: '-400px 0' }, '100%': { backgroundPosition: '400px 0' } },
      },
      animation: {
        fadeUp: 'fadeUp .45s ease-out both',
        shimmer: 'shimmer 1.4s linear infinite',
      },
    },
  },
  plugins: [],
};
