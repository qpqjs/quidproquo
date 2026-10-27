import { AskResponse } from '../../types';
import { askRunParallel } from '../system/askRunParallel';

export function* askMapParallel<T, R>(items: T[], askCallback: (item: T, index: number, srcArray: T[]) => AskResponse<R>): AskResponse<R[]> {
  const results: R[] = yield* askRunParallel(items.map((item, index) => askCallback(item, index, items)));

  return results;
}
