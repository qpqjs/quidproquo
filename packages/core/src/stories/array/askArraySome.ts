import { AskResponse } from '../../types';

export function* askArraySome<T>(items: T[], askCallback: (item: T, index: number, srcArray: T[]) => AskResponse<boolean>): AskResponse<boolean> {
  let index = 0;
  for (const item of items) {
    const result = yield* askCallback(item, index, items);

    if (result) {
      return true;
    }

    index += 1;
  }

  return false;
}
