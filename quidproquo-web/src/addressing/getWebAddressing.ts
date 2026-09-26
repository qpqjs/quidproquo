import { Nullable } from 'quidproquo-core';
import { WebAddressing, WebAddressingMode } from 'quidproquo-webserver';

// Subdomain mode with no known entries: the shape of a bundle nothing was baked into.
const UNADDRESSED: WebAddressing = { mode: WebAddressingMode.subdomain, rootDomains: [], entries: [], apis: [], webSockets: [] };

// This package targets the browser and has no node types; the views build replaces the whole
// `process.env` expression with a JSON string literal, so a bundle never touches `process`.
// Anywhere it was not replaced and `process` does not exist, the ReferenceError means "nothing baked".
declare const process: { env: Record<string, string | undefined> };

const readBakedWebAddressing = (): Nullable<string> => {
  try {
    return process.env.QPQ_WEB_ADDRESSING ?? null;
  } catch {
    return null;
  }
};

let cached: Nullable<{ raw: string; value: WebAddressing }> = null;

/** The addressing baked into this bundle by the views build, or subdomain mode with no entries. */
export const getWebAddressing = (): WebAddressing => {
  const raw = readBakedWebAddressing();
  if (raw === null) {
    return UNADDRESSED;
  }
  if (cached?.raw !== raw) {
    cached = { raw, value: JSON.parse(raw) as WebAddressing };
  }
  return cached.value;
};
