"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

import { SettingsDrawer } from "@/components/settings/SettingsDrawer";

type DashboardUIContextValue = {
  openSettings: () => void;
};

const DashboardUIContext = createContext<DashboardUIContextValue | null>(null);

export function DashboardUIProvider({ children }: { children: ReactNode }) {
  const [settingsOpen, setSettingsOpen] = useState(false);

  return (
    <DashboardUIContext.Provider value={{ openSettings: () => setSettingsOpen(true) }}>
      {children}
      <SettingsDrawer open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </DashboardUIContext.Provider>
  );
}

export function useDashboardUI() {
  const context = useContext(DashboardUIContext);

  if (!context) {
    throw new Error("useDashboardUI must be used within DashboardUIProvider");
  }

  return context;
}
