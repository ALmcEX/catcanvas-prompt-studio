"use client";
import { useSyncExternalStore } from "react";
const subscribe = (callback: () => void) => {
  window.addEventListener("storage", callback);
  window.addEventListener("studio-theme", callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener("studio-theme", callback);
  };
};
const snapshot = () => {
  try {
    return localStorage.getItem("studio-theme") || "system";
  } catch {
    return "system";
  }
};
export function Theme() {
  const theme = useSyncExternalStore(subscribe, snapshot, () => "system");
  return (
    <label className="theme-picker">
      <span>Appearance</span>
      <select
        aria-label="Appearance"
        value={theme}
        onChange={(event) => {
          const value = event.target.value;
          try {
            localStorage.setItem("studio-theme", value);
          } catch {}
          document.documentElement.dataset.theme = value;
          window.dispatchEvent(new Event("studio-theme"));
        }}
      >
        <option value="system">System</option>
        <option value="light">Light</option>
        <option value="dark">Dark</option>
      </select>
    </label>
  );
}
