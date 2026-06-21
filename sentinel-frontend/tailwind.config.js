/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#4F46E5",
          light: "#7D76FF",
          dark: "#2F27B1",
        },
        secondary: {
          DEFAULT: "#06B6D4",
        },
        accent: {
          DEFAULT: "#A78BFA",
        },
        dark: {
          bg: "#0A0A0B",
          card: "#121214",
          border: "#262626",
          text: "#FBFBFB",
        },
        milk: "#FBFBFB",
        brand: {
          50: "#eef2ff",
          100: "#e0e7ff",
          200: "#c7d2fe",
          300: "#a5b4fc",
          400: "#818cf8",
          500: "#6366f1",
          600: "#4f46e5",
          700: "#4338ca",
          800: "#3730a3",
          900: "#312e81",
        },
      },
      backgroundImage: {
        'gradient-primary': "linear-gradient(to right, #7D76FF, #2F27B1)",
        'gradient-text': "linear-gradient(to bottom, #F8F8F8, #7670DE)",
        'gradient-radial': "radial-gradient(var(--tw-gradient-stops))",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        display: ["Outfit", "Inter", "sans-serif"],
        mono: ["JetBrains Mono", "Fira Code", "monospace"],
      },
      boxShadow: {
        'premium': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06), 0 0 20px -5px rgba(79, 70, 229, 0.2)',
        'glass': '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
      },
      borderRadius: {
        'xl': '1rem',
        '2xl': '1.5rem',
        '3xl': '2rem',
      }
    },
  },
  plugins: [],
};
