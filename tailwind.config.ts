import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
        serif: ["var(--font-serif)", "Georgia", "serif"],
      },
      colors: {
        gold: "#b8860b",
        muted: "#717171",
        border: "#ebebeb",
        ink: "#1a1a1a",
      },
      maxWidth: { content: "1200px" },
      borderRadius: { card: "16px", pill: "999px" },
    },
  },
  plugins: [],
};
export default config;
