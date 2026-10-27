import { askContextRead, askDateNow, askNewGuid, AskResponse } from 'quidproquo-core';
import { askQueryParamsGetAll } from 'quidproquo-web';

import { askUISessionLogDocCreated } from '../../actionCreators/sessionLog/askUISessionLogDocCreated';
import { askApplySessionEvent } from '../../actions/askApplySessionEvent';
import { adminUserContext } from '../../contexts/adminUserContext';
import { AdminSessionEventType } from '../../effects/session/AdminSessionEventType';
import { CorrelationOpenedData } from '../../effects/session/CorrelationOpenedEvent';
import { SessionStartedData } from '../../effects/session/SessionStartedEvent';
import { CorrelationOpenSource } from '../../types/CorrelationOpenSource';
import { seededParamsFromQueryParams } from '../url/seededParamsFromQueryParams';
import { askSessionApiCreate } from './askSessionApiCreate';
import { askSessionApiListAllEvents } from './askSessionApiListAllEvents';

// Login begins a session: create the event doc (the audit anchor), seed the
// local log with its acked events (INIT_STATE), then record sessionStarted with
// whatever the URL deep-linked to.
export function* askStartSession(): AskResponse<void> {
  const { username } = yield* askContextRead(adminUserContext);

  const queryParams = yield* askQueryParamsGetAll();
  const seededParams = seededParamsFromQueryParams(queryParams);

  const loginAt = yield* askDateNow();
  const code = yield* askNewGuid();

  const summary = yield* askSessionApiCreate(`${username} — ${loginAt}`, code);
  const ackedEvents = yield* askSessionApiListAllEvents(summary.id);

  yield* askUISessionLogDocCreated(summary.id, ackedEvents);

  yield* askApplySessionEvent<SessionStartedData>(AdminSessionEventType.sessionStarted, { username, seededParams });

  if (seededParams.correlation) {
    yield* askApplySessionEvent<CorrelationOpenedData>(AdminSessionEventType.correlationOpened, {
      correlationId: seededParams.correlation,
      source: CorrelationOpenSource.deepLink,
    });
  }
}
