/**
 * Double-quote a SQL identifier, doubling any embedded quotes. Quoting instead
 * of stripping characters keeps hyphenated store names intact; mapping '-' to
 * '_' would let 'user-sessions' and 'user_sessions' collide.
 */
export const quoteSqlIdentifier = (name: string): string => `"${name.replace(/"/g, '""')}"`;
