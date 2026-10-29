import { createActionRequester } from '../../logic/actions';
import { MathActionType } from './MathActionType';

/**
 * A number in [0, 1) from the platform's plain pseudo-random generator (Math.random). Not a secure source: never use
 * it for tokens, ids or anything an attacker must not predict; use askSecureTokenGenerate or askGuidNew for those.
 */
export const askRandomNumber = createActionRequester<number>()({
  actionType: MathActionType.RandomNumber,
});
