"use client";

import { createContext, useContext, useSyncExternalStore } from "react";
import type { ReactNode } from "react";
import type { AnalyticsDashboardSlug } from "@/lib/analytics-dashboards";

type DashboardTheme = "dark" | "light";

const STORAGE_KEY = "portfolio-dashboard-theme";
const CHANGE_EVENT = "portfolio-dashboard-theme-change";
let fallbackTheme: DashboardTheme = "dark";
const DashboardThemeContext = createContext<{
  theme: DashboardTheme;
  toggleTheme: () => void;
} | null>(null);

function subscribe(onChange: () => void) {
  window.addEventListener("storage", onChange);
  window.addEventListener(CHANGE_EVENT, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(CHANGE_EVENT, onChange);
  };
}

function getTheme(): DashboardTheme {
  try {
    return window.localStorage.getItem(STORAGE_KEY) === "light" ? "light" : "dark";
  } catch {
    return fallbackTheme;
  }
}

export function useDashboardTheme() {
  const context = useContext(DashboardThemeContext);
  if (!context) throw new Error("Dashboard theme controls must be inside DashboardThemeShell.");
  return context;
}

export function DashboardThemeShell({ project, children }: {
  project: AnalyticsDashboardSlug;
  children: ReactNode;
}) {
  const theme = useSyncExternalStore(subscribe, getTheme, () => "dark" as const);
  const toggleTheme = () => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    try {
      window.localStorage.setItem(STORAGE_KEY, nextTheme);
    } catch {
      fallbackTheme = nextTheme;
    }
    window.dispatchEvent(new Event(CHANGE_EVENT));
  };

  return (
    <DashboardThemeContext.Provider value={{ theme, toggleTheme }}>
      <main id="main-content" className={`analytics-project-page analytics-project-page-${project}`} data-dashboard-theme={theme}>
        {children}
      </main>
    </DashboardThemeContext.Provider>
  );
}
