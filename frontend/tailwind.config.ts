import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/features/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Accent — warm saffron-amber
        accent: {
          DEFAULT: "#C8873A",
          light: "rgba(200,135,58,0.15)",
          dark: "#A06828",
        },
        // Semantic
        success: {
          DEFAULT: "#4C9A6E",
          bg: "rgba(76,154,110,0.14)",
        },
        danger: {
          DEFAULT: "#C0524A",
          bg: "rgba(192,82,74,0.14)",
        },
        warning: {
          DEFAULT: "#B8862E",
          bg: "rgba(184,134,46,0.14)",
        },
        // Text
        "text-primary": "#1C1410",
        "text-secondary": "#6B5D50",
        "text-tertiary": "#9E8E80",
        "text-on-accent": "#FFFFFF",
        // Glass surfaces (as CSS var references — actual rgba in globals.css)
        glass: {
          base: "rgba(255,252,245,0.55)",
          sidebar: "rgba(255,250,240,0.62)",
          card: "rgba(255,253,248,0.60)",
          input: "rgba(255,252,246,0.70)",
          modal: "rgba(255,251,244,0.72)",
          border: "rgba(255,255,255,0.45)",
        },
      },
      fontFamily: {
        display: ["var(--font-playfair)", "Georgia", "serif"],
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        mono: ["var(--font-jetbrains)", "monospace"],
      },
      fontSize: {
        "2xs": ["11px", { lineHeight: "1.5" }],
        xs: ["13px", { lineHeight: "1.5" }],
        sm: ["15px", { lineHeight: "1.6" }],
        base: ["15px", { lineHeight: "1.6" }],
        md: ["17px", { lineHeight: "1.5" }],
        lg: ["20px", { lineHeight: "1.4" }],
        xl: ["28px", { lineHeight: "1.3" }],
        hero: ["36px", { lineHeight: "1.2" }],
      },
      spacing: {
        "1": "4px",
        "2": "8px",
        "3": "12px",
        "4": "16px",
        "5": "20px",
        "6": "24px",
        "8": "32px",
        "10": "40px",
        "12": "48px",
        "16": "64px",
      },
      borderRadius: {
        sm: "10px",
        md: "16px",
        lg: "20px",
        xl: "28px",
        full: "9999px",
      },
      backdropBlur: {
        bg: "40px",
        panel: "20px",
        card: "16px",
        modal: "24px",
        input: "8px",
        xs: "6px",
      },
      boxShadow: {
        card: "0 4px 24px rgba(180,150,100,0.10), 0 1px 4px rgba(180,150,100,0.08)",
        panel: "0 8px 40px rgba(160,130,80,0.12), 0 2px 8px rgba(160,130,80,0.08)",
        modal: "0 16px 64px rgba(140,110,60,0.18), 0 4px 16px rgba(140,110,60,0.10)",
        btn: "0 2px 12px rgba(200,135,58,0.22)",
        "btn-hover": "0 4px 18px rgba(200,135,58,0.30)",
      },
      keyframes: {
        pageEnter: {
          from: { opacity: "0", transform: "translateY(10px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        rowEnter: {
          from: { opacity: "0", transform: "translateY(6px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        slideInRight: {
          from: { transform: "translateX(calc(100% + 32px))", opacity: "0" },
          to: { transform: "translateX(0)", opacity: "1" },
        },
        slideOutRight: {
          from: { transform: "translateX(0)", opacity: "1" },
          to: { transform: "translateX(calc(100% + 32px))", opacity: "0" },
        },
        slideInUp: {
          from: { transform: "translateY(calc(100% + 16px))", opacity: "0" },
          to: { transform: "translateY(0)", opacity: "1" },
        },
        fadeIn: {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        shimmer: {
          "0%": { backgroundPosition: "200% 0" },
          "100%": { backgroundPosition: "-200% 0" },
        },
        toastIn: {
          from: { opacity: "0", transform: "translateX(16px) scale(0.96)" },
          to: { opacity: "1", transform: "translateX(0) scale(1)" },
        },
        scaleIn: {
          from: { opacity: "0", transform: "scale(0.94)" },
          to: { opacity: "1", transform: "scale(1)" },
        },
        counterRoll: {
          from: { opacity: "0", transform: "translateY(8px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "page-enter": "pageEnter 280ms cubic-bezier(0.32,0.72,0,1) both",
        "row-enter": "rowEnter 200ms ease both",
        "slide-in-right": "slideInRight 250ms cubic-bezier(0.32,0.72,0,1) both",
        "slide-out-right": "slideOutRight 200ms cubic-bezier(0.32,0.72,0,1) both",
        "slide-in-up": "slideInUp 260ms cubic-bezier(0.32,0.72,0,1) both",
        "fade-in": "fadeIn 200ms ease both",
        shimmer: "shimmer 1.4s ease infinite",
        "toast-in": "toastIn 250ms ease both",
        "scale-in": "scaleIn 200ms cubic-bezier(0.32,0.72,0,1) both",
        "counter-roll": "counterRoll 300ms ease both",
      },
      transitionTimingFunction: {
        spring: "cubic-bezier(0.32,0.72,0,1)",
      },
      zIndex: {
        bg: "0",
        overlay: "1",
        app: "2",
        sidebar: "10",
        dropdown: "30",
        drawer: "51",
        "drawer-overlay": "50",
        modal: "61",
        "modal-overlay": "60",
        toast: "70",
      },
    },
  },
  plugins: [],
};

export default config;
