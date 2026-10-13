/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // TestExcel monochrome brand tokens
        ink: '#0a0a0a',
        surface: '#141414',
        'grey-900': '#1c1c1c',
        'grey-700': '#3d3d3d',
        'grey-500': '#6b6b6b',
        'grey-400': '#8c8c8c',
        'grey-200': '#d6d6d6',
        'grey-100': '#ececec',
        paper: '#f4f3f1',
      },
      fontFamily: {
        display: ['Archivo', 'Helvetica Neue', 'Arial', 'sans-serif'],
        body: ['Inter', 'Helvetica Neue', 'Arial', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'monospace'],
      },
      boxShadow: {
        glow: '0 0 8px rgba(250,250,250,0.7)',
      },
    },
  },
  plugins: [],
};
