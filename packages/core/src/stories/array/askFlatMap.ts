import { AskResponse } from '../../types';
import { askMap } from './askMap';

export function* askFlatMap<T, R>(items: T[], askCallback: (item: T, index: number, srcArray: T[]) => AskResponse<R[]>): AskResponse<R[]> {
  const results = yield* askMap(items, askCallback);

  return results.flat();
}
