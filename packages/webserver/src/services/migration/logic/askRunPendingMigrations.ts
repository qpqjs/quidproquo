import { askLogCreate, askQueueSendMessages, AskResponse, LogLevelEnum, QueueMessage } from 'quidproquo-core';

import { askPendingMigrations, askRecordMigrationRan, getMigrationKey } from './pendingMigrations';

/**
 * Enqueue every migration that has not run yet, and record it as run.
 *
 * The same two steps `askProcessOnDeployUpdate` performs, without the deploy event. Deployed,
 * a stack update is what triggers migrations; locally nothing ever does, which is why
 * `qpq migrate` exists — and why this goes through the SAME queue rather than invoking the
 * handlers directly. A migration that only works under the local runner is worse than no
 * local runner: the point is to rehearse the deployed path.
 *
 * Returns the keys enqueued, so a caller can report what it did (and report nothing when
 * there was nothing to do, which should be the common case).
 *
 * Recording happens per migration as it is enqueued, matching the deploy path. That means a
 * migration is marked run before its handler necessarily finishes: a crash mid-run leaves it
 * recorded and unfinished, so migrations have to be safe to write as idempotent anyway.
 */
export function* askRunPendingMigrations(): AskResponse<string[]> {
  const pending = yield* askPendingMigrations();

  for (const migration of pending) {
    const key = getMigrationKey(migration);

    yield* askLogCreate(LogLevelEnum.Info, `Running migration: ${key}`);

    const message: QueueMessage<undefined> = { type: key, payload: undefined };
    yield* askQueueSendMessages('qpqMigrations', message);

    yield* askRecordMigrationRan(migration);
  }

  return pending.map(getMigrationKey);
}
