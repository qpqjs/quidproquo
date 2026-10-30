import { createActionRequester } from '../../logic/actions';
import { GuidActionType } from './GuidActionType';

export const askGuidNewSortable = createActionRequester<string>()({
  actionType: GuidActionType.NewSortable,
});
