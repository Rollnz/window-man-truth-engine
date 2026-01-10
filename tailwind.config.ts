import type { Config } from "tailwindcss";
import tailwindcssAnimate from "tailwindcss-animate";

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
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
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        glow: {
          DEFAULT: "hsl(var(--glow))",
          muted: "hsl(var(--glow-muted))",
        },
        success: {
          DEFAULT: "hsl(var(--success))",
          foreground: "hsl(var(--success-foreground))",
        },
        warning: {
          DEFAULT: "hsl(var(--warning))",
          foreground: "hsl(var(--warning-foreground))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
        // Global Dossier/Forensic Theme
        dossier: {
          page: "hsl(220 20% 6%)",      // #0A0F14 - page background
          folder: "hsl(220 20% 14%)",   // Case file cards, elevated surfaces
          modal: "hsl(220 20% 12%)",    // Modal/dialog surfaces
          surface: "hsl(220 20% 10%)",  // Alternative elevated surface
        },
        // Tool-Specific Themes
        tools: {
          "truth-engine": {
            DEFAULT: "hsl(189 100% 50%)",     // #00D4FF - Neon cyan
            light: "hsl(189 100% 60%)",
            dark: "hsl(189 100% 40%)",
            glow: "hsl(189 100% 50% / 0.2)",
          },
          "claim-survival": {
            DEFAULT: "hsl(0 100% 63%)",       // #FF4444 - Red alert
            light: "hsl(0 100% 70%)",
            dark: "hsl(0 100% 50%)",
            glow: "hsl(0 100% 63% / 0.2)",
          },
          "tool-3": {
            DEFAULT: "hsl(220 20% 65%)",
            light: "hsl(220 20% 75%)",
            dark: "hsl(220 20% 55%)",
            glow: "hsl(220 20% 65% / 0.2)",
          },
          "tool-4": {
            DEFAULT: "hsl(220 20% 65%)",
            light: "hsl(220 20% 75%)",
            dark: "hsl(220 20% 55%)",
            glow: "hsl(220 20% 65% / 0.2)",
          },
          "tool-5": {
            DEFAULT: "hsl(220 20% 65%)",
            light: "hsl(220 20% 75%)",
            dark: "hsl(220 20% 55%)",
            glow: "hsl(220 20% 65% / 0.2)",
          },
          "tool-6": {
            DEFAULT: "hsl(220 20% 65%)",
            light: "hsl(220 20% 75%)",
            dark: "hsl(220 20% 55%)",
            glow: "hsl(220 20% 65% / 0.2)",
          },
          "tool-7": {
            DEFAULT: "hsl(220 20% 65%)",
            light: "hsl(220 20% 75%)",
            dark: "hsl(220 20% 55%)",
            glow: "hsl(220 20% 65% / 0.2)",
          },
          "tool-8": {
            DEFAULT: "hsl(220 20% 65%)",
            light: "hsl(220 20% 75%)",
            dark: "hsl(220 20% 55%)",
            glow: "hsl(220 20% 65% / 0.2)",
          },
          "tool-9": {
            DEFAULT: "hsl(220 20% 65%)",
            light: "hsl(220 20% 75%)",
            dark: "hsl(220 20% 55%)",
            glow: "hsl(220 20% 65% / 0.2)",
          },
          "tool-10": {
            DEFAULT: "hsl(220 20% 65%)",
            light: "hsl(220 20% 75%)",
            dark: "hsl(220 20% 55%)",
            glow: "hsl(220 20% 65% / 0.2)",
          },
          "tool-11": {
            DEFAULT: "hsl(220 20% 65%)",
            light: "hsl(220 20% 75%)",
            dark: "hsl(220 20% 55%)",
            glow: "hsl(220 20% 65% / 0.2)",
          },
          "tool-12": {
            DEFAULT: "hsl(220 20% 65%)",
            light: "hsl(220 20% 75%)",
            dark: "hsl(220 20% 55%)",
            glow: "hsl(220 20% 65% / 0.2)",
          },
        },
      },
      letterSpacing: {
        declassified: "0.2em",      // Forensic/monospace headers
        "stamp-wide": "0.15em",     // Slightly tighter for small text
        redacted: "0.3em",          // Extra wide for censored/redacted text
      },
      fontFamily: {
        typewriter: ["Courier New", "Courier", "monospace"],
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
        "fade-in": {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in-up": {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "count-up": {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "pulse-glow": {
          "0%, 100%": { boxShadow: "0 0 20px hsl(var(--glow) / 0.4)" },
          "50%": { boxShadow: "0 0 30px hsl(var(--glow) / 0.6)" },
        },
        "shimmer": {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        "float": {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-8px)" },
        },
        "glow-pulse": {
          "0%, 100%": { filter: "drop-shadow(0 8px 24px hsl(var(--primary) / 0.3))" },
          "50%": { filter: "drop-shadow(0 12px 32px hsl(var(--primary) / 0.5))" },
        },
        "pulse-pop": {
          "0%": { transform: "scale(1)" },
          "50%": { transform: "scale(1.08)" },
          "100%": { transform: "scale(1)" },
        },
        "border-shimmer": {
          "0%": { backgroundPosition: "200% 0" },
          "100%": { backgroundPosition: "-200% 0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in 0.5s ease-out forwards",
        "fade-in-up": "fade-in-up 0.6s ease-out forwards",
        "count-up": "count-up 0.4s ease-out forwards",
        "pulse-glow": "pulse-glow 2s ease-in-out infinite",
        "shimmer": "shimmer 2s linear infinite",
        "float": "float 6s ease-in-out infinite",
        "glow-pulse": "glow-pulse 3s ease-in-out infinite",
        "border-shimmer": "border-shimmer 3s ease-in-out infinite",
      },
    },
  },
  plugins: [tailwindcssAnimate],
} satisfies Config;
