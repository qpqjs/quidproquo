import { dynamicRoute } from '@qpqjs/features';
import { AskResponse, HTTPEventResponse } from 'quidproquo';

// GET /security/unknown-action. Public. Yields an action type no processor
// implements, so the probe can read what the platform sends a caller when the
// dispatch loop itself fails. Naming the missing action back is the contract
// (the user-script sandbox relies on it); listing the registered ones is not.
export const unknownAction = dynamicRoute(['GET', '/security/unknown-action'], function* (): AskResponse<HTTPEventResponse> {
  return yield { type: 'SecurityProbe/NoSuchAction' } as any;
});
