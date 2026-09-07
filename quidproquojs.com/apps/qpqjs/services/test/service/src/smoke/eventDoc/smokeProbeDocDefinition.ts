import { AskResponse, Effect, QpqReducer } from 'quidproquo';
import {
  askApplyEventDocEvent,
  buildEventDocFoldReducer,
  createEventDocDefinition,
  createEventDocInitialDocumentState,
  EventDocDocument,
  EventDocEvent,
  EventDocEventPayload,
} from 'quidproquo-features';

import {
  SMOKE_EVENT_DOC_MARK_EVENT,
  SMOKE_EVENT_DOC_STORE,
  SMOKE_EVENT_DOC_TYPE,
} from '../constants/smokeEventDoc';
import { SmokeEventDocMark } from '../models/SmokeEventDocMark';

// The probe doc type the event-doc smoke tests write to: one event (a mark) and one
// fact folded from it (the marks, in log order). Small on purpose - it exists so the
// deployed runtime exercises a REGISTERED collection end to end: the append gate, the
// stream projector's snapshot fold, and the state reads that resolve through the
// dynamic-functions registration all run this definition.
export type SmokeProbeDocState = EventDocDocument & {
  marks: SmokeEventDocMark[];
};

const createInitialSmokeProbeDocState = (): SmokeProbeDocState => ({
  ...createEventDocInitialDocumentState(1),
  marks: [],
});

type SmokeProbeDocEffects = Effect<
  typeof SMOKE_EVENT_DOC_MARK_EVENT,
  EventDocEventPayload<SmokeEventDocMark>
>;

const smokeProbeDocFoldReducer = buildEventDocFoldReducer<
  SmokeProbeDocState,
  SmokeProbeDocEffects
>(createInitialSmokeProbeDocState, {
  [SMOKE_EVENT_DOC_MARK_EVENT]: (state, payload) => ({
    ...state,
    marks: [...state.marks, payload.data],
  }),
}) as QpqReducer<SmokeProbeDocState, EventDocEvent>;

function* askSmokeProbeDocMark(mark: SmokeEventDocMark): AskResponse<void> {
  yield* askApplyEventDocEvent(SMOKE_EVENT_DOC_MARK_EVENT, mark);
}

export const smokeProbeDocDefinition = createEventDocDefinition({
  storeName: SMOKE_EVENT_DOC_STORE,
  type: SMOKE_EVENT_DOC_TYPE,
  schemaVersion: 1,
  versions: [
    {
      version: 1,
      views: {
        document: {
          foldReducer: smokeProbeDocFoldReducer,
          createInitialViewState: createInitialSmokeProbeDocState,
        },
      },
    },
  ],
  api: { askSmokeProbeDocMark },
});
