import { AskResponse } from '../../types';

export function* askMap<T, R>(items: T[], askCallback: (item: T, index: number, srcArray: T[]) => AskResponse<R>): AskResponse<R[]> {
  const mappedItems: R[] = [];

  let index = 0;
  for (const item of items) {
    mappedItems.push(yield* askCallback(item, index, items));
    index += 1;
  }

  return mappedItems;
}
