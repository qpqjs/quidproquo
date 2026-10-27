import { AskResponse } from 'quidproquo-core';
import { EventDocSummary } from 'quidproquo-features';

import { adminSessionApiBasePath } from '../../constants/adminSessionApiBasePath';
import { askSessionApiRequestOrThrow } from './askSessionApiRequestOrThrow';

// POST /v1/admin/session — creates the session doc (server seeds INIT_STATE)
// and returns its summary; the id anchors the whole audited session.
export function* askSessionApiCreate(name: string, code: string): AskResponse<EventDocSummary> {
  return yield* askSessionApiRequestOrThrow<{ name: string; code: string }, EventDocSummary>('POST', adminSessionApiBasePath, { name, code });
}
