import { createActionRequester } from '../../logic/actions';
import { GuidActionType } from './GuidActionType';

export const askNewSortableGuid = createActionRequester<string>()({
  actionType: GuidActionType.NewSortable,
});
