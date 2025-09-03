import { ERROR_MESSAGES, MOD_KEYS_ORDER } from "./constants";
import { ShortcutRecorderError, ShortcutRecorderErrorCode } from "./types";

// Helper function to set formatted error
export const getFormattedError = (
  code: ShortcutRecorderErrorCode,
  params: Record<string, string | number> = {},
): ShortcutRecorderError => {
  let message = ERROR_MESSAGES[code];

  // Replace placeholders with actual values
  Object.entries(params).forEach(([key, value]) => {
    message = message.replace(`{${key}}`, value.toString());
  });

  return { code, message };
};

export const getOrderedKeys = (
  nonModKey: string | undefined,
  modKeys: Set<string> | undefined,
): string[] => {
  const orderedKeys: string[] = [];

  if (modKeys) {
    MOD_KEYS_ORDER.forEach((modifier) => {
      if (modKeys && modKeys?.has(modifier)) {
        orderedKeys.push(modifier);
      }
    });
  }

  if (nonModKey) orderedKeys.push(nonModKey);

  return orderedKeys;
};
