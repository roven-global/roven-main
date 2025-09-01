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
        border: "#849289",
        input: "#E6EAE3",
        ring: "#578466",
        background: "#E5E9E2",
        foreground: "#1D352D",
        primary: {
          DEFAULT: "#1D352D",
          hover: "#26473E", // lighter green-black on hover
          foreground: "#E6EAE3",
        },
        secondary: {
          DEFAULT: "#686761",
          hover: "#7A7972", // lighter grey on hover
          foreground: "#E6EAE3",
        },
        destructive: {
          DEFAULT: "#cd1d00",
          hover: "#e22b0f", // brighter red
          foreground: "#E6EAE3",
        },
        muted: {
          DEFAULT: "#6A7869",
          hover: "#7E8D7D",
          foreground: "#E6EAE3",
        },
        accent: {
          DEFAULT: "#578466",
          hover: "#699878",
          foreground: "#E6EAE3",
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
          accent: "#578466",
          "accent-foreground": "#E6EAE3",
          border: "#849289",
          ring: "#578466",
        },
        dark: "#1D352D",
        "muted-brown": "#686761",
        "soft-green": "#6A7869",
        "muted-pink-brown": "#849289",
        "alert-error": "#cd1d00",
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
