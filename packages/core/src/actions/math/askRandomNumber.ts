import { createActionRequester } from '../../types';
import { MathActionType } from './MathActionType';

export const askRandomNumber = createActionRequester<number>()({
  actionType: MathActionType.RandomNumber,
});
