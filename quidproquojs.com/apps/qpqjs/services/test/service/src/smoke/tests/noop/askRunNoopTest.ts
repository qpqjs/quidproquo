import { askLogCreate, AskResponse, LogLevelEnum } from 'quidproquo';

// Does nothing but prove the loop: a registered test gets executed inside a
// deployed story, records a log line, and reports back through the run record.
export function* askRunNoopTest(): AskResponse<void> {
  yield* askLogCreate(LogLevelEnum.Info, 'noop smoke test ran');
}
