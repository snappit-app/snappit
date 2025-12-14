import { getAllWindows, Theme as TauriTheme } from "@tauri-apps/api/window";
import { createEffect, createMemo, createSignal, onCleanup } from "solid-js";

import { SNAPPIT_CONSTS } from "@/shared/constants";
import { SnappitStore } from "@/shared/store";

export type themeOptions = "light" | "dark" | "system";

type ThemeTuple = readonly [() => themeOptions, (t: themeOptions) => void];

export abstract class Theme {
  private static _themeSingleton: ThemeTuple | null = null;

  static create() {
    if (this._themeSingleton) return this._themeSingleton;
    const THEME_KEY = SNAPPIT_CONSTS.store.keys.theme;
    const [storeTheme, setStoreTheme] = SnappitStore.createValue<themeOptions>(THEME_KEY);

    const preference = createMemo<themeOptions>(() => {
      const stored = storeTheme();
      if (stored === "light" || stored === "dark" || stored === "system") {
        return stored;
      } else {
        return "system";
      }
    });

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
      const pref = preference();
      const effectiveDark = pref === "system" ? systemDark() : pref === "dark";

      if (typeof document !== "undefined") {
        const root = document.documentElement;
        root.classList.toggle("dark", !!effectiveDark);
        root.setAttribute("data-kb-theme", effectiveDark ? "dark" : "light");
      }

      // Set theme for all Tauri windows
      const tauriTheme: TauriTheme | null =
        pref === "light" ? "light" : pref === "dark" ? "dark" : null;

      getAllWindows().then((windows) => {
        console.log(windows);

        windows.forEach((win) => {
          win.setTheme(tauriTheme);
        });
      });
    });

    function setTheme(t: themeOptions) {
      setStoreTheme(t);
    }

    this._themeSingleton = [preference, setTheme] as const;
    return this._themeSingleton;
  }
}
