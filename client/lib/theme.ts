/** Theme preference shared by the toggle and the pre-paint script. */
export type ThemePreference = "system" | "light" | "dark";

export const themeStorageKey = "haven-theme";

/* Values only — each doubles as its key in the `theme` message namespace, so
   the control is labelled in whichever language the page is in. */
export const themeOptions = [
  { value: "system" },
  { value: "light" },
  { value: "dark" },
] as const satisfies readonly { value: ThemePreference }[];

/**
 * Runs before the first paint, so the page is never drawn in the wrong theme
 * and then corrected. Kept to one statement and wrapped in try/catch because
 * storage is unavailable in some privacy modes.
 */
export const themeScript = `(function(){try{var p=localStorage.getItem("${themeStorageKey}");var d=p==="dark"||((!p||p==="system")&&window.matchMedia("(prefers-color-scheme: dark)").matches);var r=document.documentElement;r.dataset.theme=d?"dark":"light";r.style.colorScheme=d?"dark":"light";}catch(e){}})();`;

/** Single place that writes the attribute the CSS reads. */
export function applyTheme(preference: ThemePreference) {
  const dark =
    preference === "dark" ||
    (preference === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);

  document.documentElement.dataset.theme = dark ? "dark" : "light";
  document.documentElement.style.colorScheme = dark ? "dark" : "light";
  return dark ? "dark" : "light";
}

export function readPreference(): ThemePreference {
  try {
    const stored = localStorage.getItem(themeStorageKey);
    return stored === "light" || stored === "dark" || stored === "system" ? stored : "system";
  } catch {
    return "system";
  }
}

export function writePreference(preference: ThemePreference) {
  try {
    localStorage.setItem(themeStorageKey, preference);
  } catch {
    // Storage blocked — the theme still applies for this page view.
  }
}

/* ---------------------------------------------------------------
   The theme lives in the DOM and in storage, not in React state, so
   the controls read it as an external store. That keeps the server
   render honest, survives hydration without a mismatch, and lets a
   change in one tab reach the others.
   --------------------------------------------------------------- */

let listeners: (() => void)[] = [];

const emit = () => {
  for (const listener of listeners) listener();
};

export function subscribeToTheme(onChange: () => void) {
  listeners.push(onChange);

  const media = window.matchMedia("(prefers-color-scheme: dark)");

  const onMediaChange = () => {
    if (readPreference() !== "system") return;
    applyTheme("system");
    emit();
  };

  const onStorageChange = (event: StorageEvent) => {
    if (event.key !== themeStorageKey) return;
    applyTheme(readPreference());
    emit();
  };

  media.addEventListener("change", onMediaChange);
  window.addEventListener("storage", onStorageChange);

  return () => {
    listeners = listeners.filter((listener) => listener !== onChange);
    media.removeEventListener("change", onMediaChange);
    window.removeEventListener("storage", onStorageChange);
  };
}

/** Call after writing the preference so every mounted control re-reads it. */
export function setTheme(preference: ThemePreference) {
  writePreference(preference);
  applyTheme(preference);
  emit();
}

export const getPreferenceSnapshot = () => readPreference();

export const getResolvedSnapshot = () =>
  document.documentElement.dataset.theme === "dark" ? "dark" : "light";

/** Both fall back to the neutral default while rendering on the server. */
export const getServerPreferenceSnapshot = (): ThemePreference => "system";
export const getServerResolvedSnapshot = () => "light" as const;
