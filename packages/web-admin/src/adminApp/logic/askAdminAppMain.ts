import { askCatch, AskResponse } from 'quidproquo-core';

import { askUIShowError } from '../../platformLogic/effects/system/systemActionCreators';
import { askRunSessionFlushLoop } from './session/askRunSessionFlushLoop';
import { askStartSession } from './session/askStartSession';
import { askProjectSessionToUrl } from './url/askProjectSessionToUrl';

// Boot story: runs once when the admin runtime mounts (after login). Starts the
// audited session from the URL, projects it back, then loops the flusher for
// the life of the page.
export function* askAdminAppMain(): AskResponse<void> {
  const started = yield* askCatch(askStartSession());

  if (!started.success) {
    yield* askUIShowError('Failed to start the admin audit session — activity will not be recorded.');
    return;
  }

  yield* askProjectSessionToUrl();

  yield* askRunSessionFlushLoop();
}
