import { createEffect, createSignal, onCleanup } from "solid-js";

import { TEXT_SNAP_CONSTS } from "@/shared/constants";
import { TextSnapStore } from "@/shared/store";

export type themeOptions = "light" | "dark" | "system";

type ThemeTuple = readonly [() => themeOptions, (t: themeOptions) => void];

let _themeSingleton: ThemeTuple | null = null;

export function createTheme(): ThemeTuple {
  if (_themeSingleton) return _themeSingleton;

  const THEME_KEY = TEXT_SNAP_CONSTS.store.keys.theme;
  const [storeTheme, setStoreTheme] = TextSnapStore.createValue<themeOptions>(THEME_KEY);

  const [preference, setPreference] = createSignal<themeOptions>("system");

  const initialSystemDark =
    typeof window !== "undefined" && window.matchMedia
      ? window.matchMedia("(prefers-color-scheme: dark)").matches
      : false;
  const [systemDark, setSystemDark] = createSignal<boolean>(initialSystemDark);

  let mql: MediaQueryList | null = null;
  if (typeof window !== "undefined" && window.matchMedia) {
    mql = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = (e: MediaQueryListEvent) => setSystemDark(e.matches);
    setSystemDark(mql!.matches);
    mql.addEventListener("change", handler);
    onCleanup(() => mql?.removeEventListener("change", handler));
  }

  createEffect(() => {
    const stored = storeTheme();
    if (stored === "light" || stored === "dark" || stored === "system") {
      setPreference(stored);
    } else {
      setPreference("system");
    }
  });

  createEffect(() => {
    const pref = preference();
    const effectiveDark = pref === "system" ? systemDark() : pref === "dark";

    if (typeof document !== "undefined") {
      const root = document.documentElement;
      root.classList.toggle("dark", !!effectiveDark);
      root.setAttribute("data-kb-theme", effectiveDark ? "dark" : "light");
    }
  });

  function setTheme(t: themeOptions) {
    console.log(t);
    setPreference(t);
    setStoreTheme(t).catch(() => {});
  }

  _themeSingleton = [preference, setTheme] as const;
  return _themeSingleton;
}
