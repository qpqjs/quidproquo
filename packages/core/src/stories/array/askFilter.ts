import { AskResponse } from '../../types';

export function* askFilter<T>(items: T[], askCallback: (item: T, index: number, srcArray: T[]) => AskResponse<boolean>): AskResponse<T[]> {
  const filteredItems: T[] = [];

  let index = 0;
  for (const item of items) {
    if (yield* askCallback(item, index, items)) {
      filteredItems.push(item);
    }
    index += 1;
  }

  return filteredItems;
}
