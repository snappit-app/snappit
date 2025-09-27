export const normalizeHttpUrl = (raw: string) => {
  const value = raw.trim();
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:" ? url.toString() : undefined;
  } catch {
    if (/^www\./i.test(value)) {
      return `https://${value}`;
    }
    return undefined;
  }
};
