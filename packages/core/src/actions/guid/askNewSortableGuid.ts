import { createActionRequester } from '../../types';
import { GuidActionType } from './GuidActionType';

export const askNewSortableGuid = createActionRequester<string>()({
  actionType: GuidActionType.NewSortable,
});
