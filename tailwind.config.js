/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // 🎨 Healers Brand Colors - Only 3 Main Colors!
        
        // Primary - Purple (Main Brand Color)
        primary: {
          DEFAULT: '#7c3aed',  // purple-600
          light: '#a78bfa',    // purple-400
          dark: '#6d28d9',     // purple-700
        },
        
        // Secondary - Gray (Backgrounds)
        secondary: {
          DEFAULT: '#18181b',  // gray-900
          light: '#27272a',    // gray-800
          lighter: '#3f3f46',  // gray-700
        },
        
        // Accent - Fuchsia (Buttons & Actions)
        accent: {
          DEFAULT: '#a21caf',  // fuchsia-700
          light: '#c026d3',    // fuchsia-600
          dark: '#86198f',     // fuchsia-800
        },
      },
    },
  },
  plugins: [],
}

