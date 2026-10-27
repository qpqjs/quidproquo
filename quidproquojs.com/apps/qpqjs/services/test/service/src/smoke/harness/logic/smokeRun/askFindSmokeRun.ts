import { SmokeRun } from '@qpqjs/test-models';
import { AskResponse, Nullable } from 'quidproquo';

import { askGetSmokeRunById } from '../../data/askGetSmokeRunById';

export function* askFindSmokeRun(
  runId: string
): AskResponse<Nullable<SmokeRun>> {
  return yield* askGetSmokeRunById(runId);
}
