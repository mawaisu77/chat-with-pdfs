"use client";

import { cn } from "@/lib/cn";

type ToggleProps = {
  enabled: boolean;
  onChange: (value: boolean) => void;
  label?: string;
  className?: string;
};

export function Toggle({ enabled, onChange, label, className }: ToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={enabled}
      aria-label={label}
      data-state={enabled ? "on" : "off"}
      onClick={() => onChange(!enabled)}
      className={cn("toggle", className)}
    >
      <span className="toggle-knob" />
    </button>
  );
}
