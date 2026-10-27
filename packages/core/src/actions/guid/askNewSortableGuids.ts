import { createActionRequester } from '../../types';
import { GuidActionType } from './GuidActionType';

// Mint `count` sortable ids in ONE action. The processor generates them in
// sequence, so the returned array is itself in sort order: ids[0] < ids[1] < ...
// (uuidv7's counter bits keep same-millisecond mints monotonic). The batch
// primitive for bulk writers — one append fan-out should not pay one action
// per id.
export const askNewSortableGuids = createActionRequester<string[]>()({
  actionType: GuidActionType.NewSortableMany,
  getPayload: (count: number) => ({ count }),
});
