import { createEventListener } from "@solid-primitives/event-listener";
import { getAllWindows, Theme as TauriTheme } from "@tauri-apps/api/window";
import { createEffect, createMemo } from "solid-js";

import { SNAPPIT_CONSTS } from "@/shared/constants";
import { SnappitStore } from "@/shared/store";

export type themeOptions = "light" | "dark" | "system";

type ThemeTuple = readonly [() => themeOptions, (t: themeOptions) => void];

export const toTheme = (isDark: boolean): themeOptions => (isDark ? "dark" : "light");

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
      }
      return "system";
    });

    if (typeof window !== "undefined" && window.matchMedia) {
      const mql: MediaQueryList = window.matchMedia("(prefers-color-scheme: dark)");

      const setTheme = (isDark: boolean) => {
        const root = document.documentElement;
        root.classList.toggle("dark", isDark);
        root.setAttribute("data-kb-theme", toTheme(isDark));
      };
      setTheme(mql.matches);
      createEventListener(mql, "change", (e) => setTheme(e.matches));
    }

    createEffect(() => {
      const pref = preference();
      const tauriTheme: TauriTheme | null = pref === "system" ? null : pref;

      getAllWindows().then((windows) => {
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
