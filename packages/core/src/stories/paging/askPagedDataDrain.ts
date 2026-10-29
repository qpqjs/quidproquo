import { AskResponse, QpqPagedData } from '../../types';

export type PagedDataDrainOptions<T> = {
  // Where to start, for a caller that already holds the first page.
  startPageKey?: string;

  // Asked after every page lands with everything collected so far. Answering false stops the
  // walk early; the result then carries the key of the next unread page.
  askShouldContinue?: (collected: T[]) => AskResponse<boolean>;
};

// The one page loop. Walks `askPage` from the start key until it answers no next page (or the
// caller says stop) and returns everything collected. `nextPageKey` on the result is undefined
// when the walk ran to the end, which is the normal case.
export function* askPagedDataDrain<T>(
  askPage: (nextPageKey?: string) => AskResponse<QpqPagedData<T>>,
  options?: PagedDataDrainOptions<T>,
): AskResponse<QpqPagedData<T>> {
  const items: T[] = [];
  let nextPageKey: string | undefined = options?.startPageKey;

  do {
    const page: QpqPagedData<T> = yield* askPage(nextPageKey);

    items.push(...page.items);
    nextPageKey = page.nextPageKey;

    if (nextPageKey && options?.askShouldContinue && !(yield* options.askShouldContinue(items))) {
      break;
    }
  } while (nextPageKey);

  return { items, nextPageKey };
}
