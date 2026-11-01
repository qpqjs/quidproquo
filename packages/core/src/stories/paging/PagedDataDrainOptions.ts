import { AskResponse } from '../../types';

/** Options for askPagedDataDrain. */
export type PagedDataDrainOptions<T> = {
  // Where to start, for a caller that already holds the first page.
  startPageKey?: string;

  // Asked after every page lands with everything collected so far. Answering false stops the
  // walk early; the result then carries the key of the next unread page.
  askShouldContinue?: (collected: T[]) => AskResponse<boolean>;
};
