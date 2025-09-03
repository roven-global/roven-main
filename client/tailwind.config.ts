import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        sans: ["Inter", "sans-serif"],
      },
      colors: {
        border: "#578466",
        input: "#E6EAE3",
        ring: "#578466",
        background: "#E5E9E2",
        foreground: "#1D352D",

        primary: {
          DEFAULT: "#1D352D", // Dark Green
          hover: "#26473E",
          foreground: "#E6EAE3",
        },
        secondary: {
          DEFAULT: "#4f6e5d", // Dark Muted Green
          hover: "#578466",
          foreground: "#E6EAE3",
        },
        destructive: {
          DEFAULT: "#cd1d00",
          hover: "#e22b0f",
          foreground: "#E6EAE3",
        },
        footer: {
          DEFAULT: "#fcefeb",
          foreground: "#1D352D",
        },
        accent: {
          DEFAULT: "#a3b18a", // Sage Vibrant
          hover: "#8a9b74",
          foreground: "#1D352D",
        },
        popover: {
          DEFAULT: "#E5E9E2",
          foreground: "#1D352D",
        },
        card: {
          DEFAULT: "#E5E9E2",
          foreground: "#1D352D",
        },
        sidebar: {
          DEFAULT: "#E5E9E2",
          foreground: "#1D352D",
          primary: "#1D352D",
          "primary-foreground": "#E6EAE3",
          accent: "#a3b18a", // Updated to Sage Vibrant
          "accent-foreground": "#1D352D",
          border: "#578466",
          ring: "#a3b18a", // Updated to Sage Vibrant
        },

        // Custom single colors
        dark: "#1D352D",
        "accent-green": "#578466", // keep as muted alternative
        "dark-vibrant": "#14332C",
        "light-vibrant": "#fcefeb",
        "alert-error": "#cd1d00",
        "muted-green": "#6f8160",
      },
      backgroundImage: {
        "gradient-primary": "var(--gradient-primary)",
        "gradient-luxury": "var(--gradient-luxury)",
        "gradient-subtle": "var(--gradient-subtle)",
      },
      boxShadow: {
        elegant: "var(--shadow-elegant)",
        luxury: "var(--shadow-luxury)",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
} satisfies Config;
