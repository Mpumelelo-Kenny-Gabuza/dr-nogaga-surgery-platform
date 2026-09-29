/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        // Primary brand colour — derived from the practice logo. Navigation,
        // headings, dark sections, footer.
        ink: {
          DEFAULT: "#172525", // near-black charcoal — dark section fills
          light: "#4C4D4B", // logo wordmark charcoal — body headings, muted-dark text
        },
        // Accent — derived from the practice logo. Restrained use: links,
        // active states, buttons, selected CTAs.
        teal: {
          DEFAULT: "#176B68", // deepened for AA text/button contrast
          brand: "#1E94A0", // true logo teal — large marks, icons, dark-bg accents
          dark: "#12514F",
        },
        // Backgrounds, borders, soft section fills
        cream: "#F5F3EE",
        mist: "#D9E6E7",
        line: "#DFE5E2",
        muted: "#667372",
      },
      fontFamily: {
        // Interface / body content
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        // Major editorial headings
        serif: ['"Source Serif 4"', "Georgia", "ui-serif", "serif"],
      },
      maxWidth: {
        prose: "68ch",
      },
    },
  },
  plugins: [],
};
