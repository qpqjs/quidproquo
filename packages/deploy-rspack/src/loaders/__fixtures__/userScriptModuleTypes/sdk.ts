// A user script module's types entry: re-exports from @qpqjs/core plus its own function.
export type { AskResponse } from '@qpqjs/core';
export { askNewGuid } from '@qpqjs/core';

export const shout = (text: string): string => `${text.toUpperCase()}!`;
