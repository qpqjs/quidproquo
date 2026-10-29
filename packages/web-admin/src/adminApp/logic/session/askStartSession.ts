import { askDateNow, askNewGuid, AskResponse } from '@qpqjs/core';
import { askQueryParamsGetAll } from '@qpqjs/web';

import { askUISessionLogDocCreated } from '../../actionCreators/sessionLog/askUISessionLogDocCreated';
import { askApplySessionEvent } from '../../actions/askApplySessionEvent';
import { askAdminUserRead } from '../../context';
import { AdminSessionCorrelationOpenedData } from '../../effects/session/AdminSessionCorrelationOpenedEffect';
import { AdminSessionEffect } from '../../effects/session/AdminSessionEffect';
import { AdminSessionStartedData } from '../../effects/session/AdminSessionStartedEffect';
import { CorrelationOpenSource } from '../../types/CorrelationOpenSource';
import { seededParamsFromQueryParams } from '../url/seededParamsFromQueryParams';
import { askSessionApiCreate } from './askSessionApiCreate';
import { askSessionApiListAllEvents } from './askSessionApiListAllEvents';

// Login begins a session: create the event doc (the audit anchor), seed the
// local log with its acked events (INIT_STATE), then record sessionStarted with
// whatever the URL deep-linked to.
export function* askStartSession(): AskResponse<void> {
  const { username } = yield* askAdminUserRead();

  const queryParams = yield* askQueryParamsGetAll();
  const seededParams = seededParamsFromQueryParams(queryParams);

  const loginAt = yield* askDateNow();
  const code = yield* askNewGuid();

  const summary = yield* askSessionApiCreate(`${username} — ${loginAt}`, code);
  const ackedEvents = yield* askSessionApiListAllEvents(summary.id);

  yield* askUISessionLogDocCreated(summary.id, ackedEvents);

  yield* askApplySessionEvent<AdminSessionStartedData>(AdminSessionEffect.SessionStarted, { username, seededParams });

  if (seededParams.correlation) {
    yield* askApplySessionEvent<AdminSessionCorrelationOpenedData>(AdminSessionEffect.CorrelationOpened, {
      correlationId: seededParams.correlation,
      source: CorrelationOpenSource.deepLink,
    });
  }
}
