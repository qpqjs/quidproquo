import { Nullable } from 'quidproquo-core';

/** A string argument, or null when missing, empty or not a string. */
export const readMcpStringArg = (args: Record<string, unknown>, name: string): Nullable<string> => {
  const value = args[name];

  return typeof value === 'string' && value ? value : null;
};
