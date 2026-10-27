/** JSON.parse that only accepts an object or array, returning null for anything else or on failure. */
export const parseJsonContainer = (text: string): unknown => {
  const trimmed = text.trim();
  if (!trimmed.startsWith('{') && !trimmed.startsWith('[')) {
    return null;
  }

  try {
    return JSON.parse(trimmed);
  } catch {
    return null;
  }
};
