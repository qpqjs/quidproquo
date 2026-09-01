import { AskResponse, Nullable } from 'quidproquo';

import { SmokeRun } from '@qpqjs/test-models';

import { askGetSmokeRunById } from '../../data/askGetSmokeRunById';

export function* askFindSmokeRun(
  runId: string
): AskResponse<Nullable<SmokeRun>> {
  return yield* askGetSmokeRunById(runId);
}
