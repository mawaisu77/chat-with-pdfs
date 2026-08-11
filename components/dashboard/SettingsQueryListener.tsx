"use client";

import { useSearchParams } from "next/navigation";
import { useEffect } from "react";

import { useDashboardUI } from "@/components/providers/DashboardUIProvider";

export function SettingsQueryListener() {
  const searchParams = useSearchParams();
  const { openSettings } = useDashboardUI();

  useEffect(() => {
    if (searchParams.get("settings") === "1") {
      openSettings();
    }
  }, [openSettings, searchParams]);

  return null;
}
