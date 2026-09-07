import { AskResponse } from 'quidproquo';
import { askEventDocDocumentStateLatest } from 'quidproquo-features';

import { SmokeProbeDocState } from '../../eventDoc/smokeProbeDocDefinition';
import { askSmokeAssert } from '../askSmokeAssert';

// The folded document, read the way the render/references routes read it: snapshot
// seeded (whatever the stream projector has stored so far) plus the gap, through the
// collection's REGISTERED fold. Proves the dynamic-functions registration resolves in
// the deployed runtime and that the definition's fold sees every mark the log holds.
export function* askAssertSmokeProbeDocState(
  docId: string,
  expectedMarks: number
): AskResponse<void> {
  const latest = yield* askEventDocDocumentStateLatest(docId, {
    consistentRead: true,
  });
  const state = latest?.state as SmokeProbeDocState | undefined;

  yield* askSmokeAssert(
    state?.marks.length === expectedMarks,
    `folded state holds ${state?.marks.length ?? 'no'} marks, expected ${expectedMarks}`
  );
}
