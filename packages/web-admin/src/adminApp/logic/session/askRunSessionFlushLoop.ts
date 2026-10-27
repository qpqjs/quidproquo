import { askCatch, askDelay, AskResponse, askStateRead } from 'quidproquo-core';
import { EventDocEventInput } from 'quidproquo-features';

import { askUISessionLogEventSaved } from '../../actionCreators/sessionLog/askUISessionLogEventSaved';
import { askUISessionLogFlushFailed } from '../../actionCreators/sessionLog/askUISessionLogFlushFailed';
import { askUISessionLogFlushStarted } from '../../actionCreators/sessionLog/askUISessionLogFlushStarted';
import { AdminAppState } from '../../AdminAppState';
import { sessionFlushTiming } from '../../constants/sessionFlushTiming';
import { askSessionApiAppendEvent } from './askSessionApiAppendEvent';

// Drains pending session events to the backend STRICTLY SERIALLY — one POST at
// a time, head first. Serial order is what makes the server's latest-only
// clientMessageId dedup safe, so this must never be parallelised. A failed
// append retries the same head with the SAME clientMessageId (backoff grows
// with the retry count); the poll delay doubles as the coalescing window.
export function* askRunSessionFlushLoop(): AskResponse<void> {
  while (true) {
    const { sessionLog } = yield* askStateRead<AdminAppState>('');
    const head = sessionLog.pendingEvents[0];

    if (!sessionLog.docId || !head) {
      yield* askDelay(sessionFlushTiming.pollMs);
      continue;
    }

    yield* askUISessionLogFlushStarted();

    const input: EventDocEventInput = {
      type: head.type,
      payload: {
        data: head.payload.data,
        metadata: {
          version: head.payload.metadata.version,
          clientMessageId: head.payload.metadata.clientMessageId,
        },
      },
    };

    const saved = yield* askCatch(askSessionApiAppendEvent(sessionLog.docId, input));

    if (saved.success) {
      yield* askUISessionLogEventSaved(head.payload.metadata.clientMessageId, saved.result);
    } else {
      yield* askUISessionLogFlushFailed(saved.error.errorText || 'Failed to save session event');

      const { sessionLog: failed } = yield* askStateRead<AdminAppState>('');
      yield* askDelay(Math.min(sessionFlushTiming.retryMaxMs, sessionFlushTiming.retryBaseMs * 2 ** failed.flush.retryCount));
    }
  }
}
