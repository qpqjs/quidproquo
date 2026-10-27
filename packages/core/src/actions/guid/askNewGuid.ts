import { createActionRequester } from '../../types';
import { GuidActionType } from './GuidActionType';

export const askNewGuid = createActionRequester<string>()({
  actionType: GuidActionType.New,
});
