"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

export type ThemeChoice = "light" | "dark" | "system";
export type EffectiveTheme = "light" | "dark";

interface ThemeContextValue {
  /** User's explicit choice — "light" | "dark" | "system" */
  theme: ThemeChoice;
  /** The theme that is actually applied — never "system" */
  effectiveTheme: EffectiveTheme;
  setTheme: (theme: ThemeChoice) => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: "system",
  effectiveTheme: "light",
  setTheme: () => {},
});

const STORAGE_KEY = "rr_theme";

function getSystemTheme(): EffectiveTheme {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function resolveEffective(choice: ThemeChoice): EffectiveTheme {
  if (choice === "system") return getSystemTheme();
  return choice;
}

function applyTheme(effective: EffectiveTheme) {
  document.documentElement.setAttribute("data-theme", effective);
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemeChoice>("system");
  const [effectiveTheme, setEffectiveTheme] = useState<EffectiveTheme>("light");

  // On mount — read persisted preference
  useEffect(() => {
    const stored = (localStorage.getItem(STORAGE_KEY) as ThemeChoice) ?? "system";
    const effective = resolveEffective(stored);
    setThemeState(stored);
    setEffectiveTheme(effective);
    applyTheme(effective);
  }, []);

  // Listen for OS-level changes when the user has chosen "system"
  useEffect(() => {
    if (theme !== "system") return;

    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => {
      const effective = resolveEffective("system");
      setEffectiveTheme(effective);
      applyTheme(effective);
    };

    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [theme]);

  const setTheme = useCallback((choice: ThemeChoice) => {
    const effective = resolveEffective(choice);
    setThemeState(choice);
    setEffectiveTheme(effective);
    applyTheme(effective);
    try {
      localStorage.setItem(STORAGE_KEY, choice);
    } catch {
      // localStorage unavailable in some environments — silently ignore
    }
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, effectiveTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

/** Hook to access and change the current theme */
export function useTheme() {
  return useContext(ThemeContext);
}
