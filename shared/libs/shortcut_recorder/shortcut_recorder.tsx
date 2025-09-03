import { createEventListener } from "@solid-primitives/event-listener";
import { createSignal } from "solid-js";

import { isModKey, MOD_KEYS_MAP, MOD_KEYS_ORDER } from "./constants";
import { getFormattedError, getOrderedKeys } from "./lib";
import {
  ShortcutRecorderError,
  ShortcutRecorderErrorCode,
  ShortcutRecorderOptions,
  ShortcutRecorderReturn,
} from "./types";

/**
 * A React hook that transforms any input into a shortcut recorder
 * @param options Configuration options
 * @returns Methods and properties for the shortcut recorder
 */
const createShortcutRecorder = ({
  excludedShortcuts = [[]],
  excludedModKeys = [],
  excludedKeys = [],
  minModKeys = 0,
  maxModKeys = 4,
}: ShortcutRecorderOptions = {}): ShortcutRecorderReturn => {
  if (maxModKeys < 0 || maxModKeys > 4) maxModKeys = 4;
  if (minModKeys < 0 || minModKeys > 4 || minModKeys > maxModKeys) minModKeys = 0;

  const [shortcut, setShortcut] = createSignal<string[]>([]);
  const [savedShortcut, setSavedShortcut] = createSignal<string[]>([]);
  const [isRecording, setIsRecording] = createSignal<boolean>(false);
  const [error, setError] = createSignal<ShortcutRecorderError>({
    code: ShortcutRecorderErrorCode.NONE,
    message: "",
  });

  const [activeModKeys, setActiveModKeys] = createSignal<Set<string>>(new Set());
  const [activeNonModKey, setActiveNonModKey] = createSignal<string>("");

  const excludedModKeysSet = new Set(
    excludedModKeys.filter((key) => isModKey(key)).map((key) => MOD_KEYS_MAP[key]),
  );

  const excludedKeysSet = new Set(excludedKeys.filter((key) => !isModKey(key)));
  // store the shortcut combos as strings
  const excludedShortcutsSet: Set<string> = new Set<string>(
    excludedShortcuts.flatMap((shortcut) => {
      let numNonModKeys = 0;
      const modKeyList: Set<string> = new Set();
      let nonModKey: string = "";

      for (const key of shortcut) {
        if (isModKey(key)) {
          if (excludedModKeysSet.has(MOD_KEYS_MAP[key]) || modKeyList.size > maxModKeys) return [];
          modKeyList.add(MOD_KEYS_MAP[key]);
        } else {
          numNonModKeys++;
          if (excludedKeysSet.has(key) || numNonModKeys > 1) return [];
          nonModKey = key;
        }
      }

      if (modKeyList.size < minModKeys || numNonModKeys !== 1) return [];

      const orderedKeyList = getOrderedKeys(nonModKey, modKeyList);
      return [orderedKeyList.join("")];
    }),
  );

  const numUsableModKeys = MOD_KEYS_ORDER.length - excludedModKeysSet.size;
  // Exclude no modifier keys if there are not enough to use
  if (numUsableModKeys < minModKeys) {
    excludedModKeysSet.clear();
  }

  const handleKeyDown = (e: KeyboardEvent): void => {
    if (!isRecording() || !e) return;
    e.preventDefault();
    e.stopPropagation();

    const keycode = e.code;

    if (!keycode) return;

    if (keycode === "Escape") {
      stopRecording();
      return;
    }

    setActiveModKeys((prevModKeys) => {
      const newModKeys = new Set(prevModKeys);
      if (isModKey(keycode)) {
        const modKey = MOD_KEYS_MAP[keycode];
        if (!excludedModKeysSet.has(modKey)) {
          if (newModKeys.size >= maxModKeys) {
            const err = getFormattedError(ShortcutRecorderErrorCode.MAX_MOD_KEYS_EXCEEDED, {
              maxModKeys,
            });
            setError(err);
          } else {
            newModKeys.add(modKey);
          }
        } else {
          const err = getFormattedError(ShortcutRecorderErrorCode.MOD_KEY_NOT_ALLOWED, { modKey });
          setError(err);
        }
      }
      updateShortcutFromActiveKeys(newModKeys, activeNonModKey());
      return newModKeys;
    });

    setActiveNonModKey((prevNonModKey) => {
      if (!isModKey(keycode)) {
        if (!excludedKeysSet.has(keycode)) {
          updateShortcutFromActiveKeys(activeModKeys(), keycode);
          // replace the newly pressed non mod key with old one
          return keycode;
        } else {
          const err = getFormattedError(ShortcutRecorderErrorCode.KEY_NOT_ALLOWED, { keycode });
          setError(err);
        }
      }
      return prevNonModKey;
    });
  };

  const handleKeyUp = (e: KeyboardEvent): void => {
    if (!isRecording() || !e) return;
    e.preventDefault();
    e.stopPropagation();

    const keycode = e.code;

    if (!keycode) return;

    if (keycode === "Escape") return;

    setActiveModKeys((prevModKeys) => {
      const newModKeys = new Set(prevModKeys);
      if (isModKey(keycode) && !excludedModKeysSet.has(MOD_KEYS_MAP[keycode])) {
        newModKeys.delete(MOD_KEYS_MAP[keycode]);
      }
      updateShortcutFromActiveKeys(newModKeys, activeNonModKey());
      return newModKeys;
    });

    setActiveNonModKey((prevNonModKey) => {
      if (
        !isModKey(keycode) &&
        !excludedKeysSet.has(keycode) &&
        (!prevNonModKey || prevNonModKey === keycode) &&
        shortcut().length > 0
      ) {
        const numModKeys = activeModKeys().size;

        if (numModKeys < minModKeys) {
          const err = getFormattedError(ShortcutRecorderErrorCode.MIN_MOD_KEYS_REQUIRED, {
            minModKeys,
          });
          setError(err);
          resetRecording();
          return "";
        }

        const shortcutStr = shortcut().join("");
        if (excludedShortcutsSet.has(shortcutStr)) {
          const err = getFormattedError(ShortcutRecorderErrorCode.SHORTCUT_NOT_ALLOWED, {
            shortcutStr,
          });
          setError(err);
          resetRecording();
          return "";
        }

        setSavedShortcut(shortcut());
        stopRecording();
        return "";
      }
      return prevNonModKey;
    });
  };

  // Update shortcut from active keys
  const updateShortcutFromActiveKeys = (modKeys: Set<string>, nonModKey: string): void => {
    if (modKeys.size === 0 && !nonModKey) {
      resetRecording();
      return;
    }

    setShortcut(() => {
      return getOrderedKeys(nonModKey, modKeys);
    });
  };

  const resetRecording = (): void => {
    setShortcut([]);
    setActiveModKeys(new Set<string>());
    setActiveNonModKey("");
  };

  const clearLastRecording = (): void => {
    stopRecording();
    setSavedShortcut([]);
  };

  const startRecording = (): void => {
    setIsRecording(true);
    setError({
      code: ShortcutRecorderErrorCode.NONE,
      message: "",
    });
    resetRecording();
  };

  const stopRecording = (): void => {
    resetRecording();
    setIsRecording(false);
    setError({
      code: ShortcutRecorderErrorCode.NONE,
      message: "",
    });
  };

  createEventListener(window, "keyup", (e: KeyboardEvent) => isRecording() && handleKeyUp(e));
  createEventListener(window, "keydown", (e: KeyboardEvent) => isRecording() && handleKeyDown(e));

  return {
    shortcut,
    savedShortcut,
    isRecording,
    error,
    startRecording,
    stopRecording,
    resetRecording,
    clearLastRecording,
  };
};

export default createShortcutRecorder;
