import { createActionRequester } from '../../logic/actions';
import { GuidActionType } from './GuidActionType';

export const askNewGuid = createActionRequester<string>()({
  actionType: GuidActionType.New,
});
