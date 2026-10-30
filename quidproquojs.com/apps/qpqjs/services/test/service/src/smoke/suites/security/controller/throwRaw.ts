import { dynamicRoute } from '@qpqjs/features';
import { AskResponse, HTTPEventResponse } from 'quidproquo';

import { SECURITY_PROBE_LEAK_MARKER } from '../constants/SECURITY_PROBE_LEAK_MARKER';

// GET /security/throw-raw. Public. Throws a plain Error from story code, the
// way a bug or an unmapped SDK failure would, so the probe can read what the
// platform sends a caller for an unhandled exception.
export const throwRaw = dynamicRoute(
  ['GET', '/security/throw-raw'],

  function* (): AskResponse<HTTPEventResponse> {
    throw new Error(`${SECURITY_PROBE_LEAK_MARKER} table=internal-table-name`);
  },
);
