/**
 * The one place a recorded value's JSON form and UTF-8 byte size are computed, so inline-vs-asset decisions
 * and budget checks agree. `undefined` serializes as 'null' (JSON.stringify returns undefined for it).
 */
export const serializeEventDocValue = (value: unknown): { json: string; bytes: number } => {
  const json = JSON.stringify(value) ?? 'null';

  return { json, bytes: new TextEncoder().encode(json).length };
};
