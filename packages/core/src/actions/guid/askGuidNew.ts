import { createActionRequester } from '../../logic/actions';
import { GuidActionType } from './GuidActionType';

export const askGuidNew = createActionRequester<string>()({
  actionType: GuidActionType.New,
});
