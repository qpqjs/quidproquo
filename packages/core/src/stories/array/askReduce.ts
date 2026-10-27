import { AskResponse } from '../../types';

export function* askReduce<T, R>(
  items: T[],
  initialValue: R,
  askCallback: (acc: R, item: T, index: number, srcArray: T[]) => AskResponse<R>,
): AskResponse<R> {
  let reducedItem: R = initialValue;

  let index = 0;
  for (const item of items) {
    reducedItem = yield* askCallback(reducedItem, item, index, items);
    index += 1;
  }

  return reducedItem;
}
