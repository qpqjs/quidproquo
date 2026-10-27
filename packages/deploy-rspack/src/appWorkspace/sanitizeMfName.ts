/** Turns a package alias into an identifier-safe module federation container name. */
export const sanitizeMfName = (alias: string): string => alias.replace(/^@/, '').replace(/[^A-Za-z0-9_]/g, '_');
