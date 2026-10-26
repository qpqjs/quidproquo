// A user script module's types entry: re-exports from quidproquo-core plus its own function.
export type { AskResponse } from 'quidproquo-core';
export { askNewGuid } from 'quidproquo-core';

export const shout = (text: string): string => `${text.toUpperCase()}!`;
