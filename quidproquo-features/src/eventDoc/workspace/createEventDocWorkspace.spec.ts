import {
  ActionMockMap,
  askMapParallel,
  askReduceState,
  AskResponse,
  askThrowError,
  DateActionType,
  Effect,
  ErrorTypeEnum,
  GuidActionType,
  Nullable,
  QpqPagedData,
  QpqReducer,
  runStory,
} from 'quidproquo-core';

import { describe, expect, it } from 'vitest';

import { askApplyEventDocEvent, askApplyTransientEventDocEvent, askEventDocReadIdentity, askEventDocReadState } from '../actions';
import { createEventDocStateReader } from '../definition';
import { buildEventDocFoldReducer, buildVersionRoutedReducer, createEventDocInitialDocumentState, foldEventDocLogStep } from '../fold';
import {
  EventDocDocument,
  EventDocEffect,
  EventDocEvent,
  EventDocEventInput,
  EventDocEventPayload,
  EventDocSnapshotBase,
  EventDocStatus,
} from '../models';
import { EventDocEditorValidator } from '../validation';
import { getSlotLiveEvents } from './logic/getSlotLiveEvents';
import { getSlotTransientEvents } from './logic/getSlotTransientEvents';
import {
  askUIEventDocWorkspaceAppendHistoryEvent,
  askUIEventDocWorkspaceApplyTransientEvent,
  askUIEventDocWorkspaceDropTransient,
  askUIEventDocWorkspaceReset,
  askUIEventDocWorkspaceSetHistoryEvents,
  askUIEventDocWorkspaceSetPendingEvents,
} from './actionCreators';
import { createEventDocWorkspace } from './createEventDocWorkspace';
import {
  EventDocWorkspaceBootstrap,
  EventDocWorkspaceDocumentIdentity,
  EventDocWorkspaceDocumentSlotConfig,
  EventDocWorkspaceEventsPageRequest,
  EventDocWorkspaceSlotKind,
  EventDocWorkspaceSlotOperation,
  EventDocWorkspaceState,
  EventDocWorkspaceTransport,
} from './types';

// ─── A tiny "note" document domain, scope-blind like any real editor module ────────

enum NoteEvent {
  SetTitle = 'NOTE_SET_TITLE',
  AddLine = 'NOTE_ADD_LINE',
  SetLine = 'NOTE_SET_LINE',
}

type NoteLine = { lineId: string; text: string };
type NoteState = EventDocDocument & { title: string; lines: NoteLine[] };

const createInitialNoteState = (): NoteState => ({
  ...createEventDocInitialDocumentState(1),
  title: '',
  lines: [],
});

type NoteEffects =
  | Effect<NoteEvent.SetTitle, EventDocEventPayload<{ title: string }>>
  | Effect<NoteEvent.AddLine, EventDocEventPayload<NoteLine>>
  | Effect<NoteEvent.SetLine, EventDocEventPayload<NoteLine>>;

const setLine = (state: NoteState, payload: EventDocEventPayload<NoteLine>): NoteState => ({
  ...state,
  lines: state.lines.map((line) => (line.lineId === payload.data.lineId ? { ...line, text: payload.data.text } : line)),
});

const noteFoldReducer = buildEventDocFoldReducer<NoteState, NoteEffects>(createInitialNoteState, {
  [NoteEvent.SetTitle]: (state, payload) => ({ ...state, title: payload.data.title }),
  [NoteEvent.AddLine]: (state, payload) => ({ ...state, lines: [...state.lines, payload.data] }),
  [NoteEvent.SetLine]: setLine,
}) as QpqReducer<NoteState, EventDocEvent>;

function* askNoteSetTitle(title: string): AskResponse<void> {
  yield* askApplyEventDocEvent(NoteEvent.SetTitle, { title });
}

function* askNoteAddLine(lineId: string, text: string): AskResponse<void> {
  yield* askApplyEventDocEvent(NoteEvent.AddLine, { lineId, text });
}

function* askNoteSetLine(lineId: string, text: string): AskResponse<void> {
  yield* askApplyEventDocEvent(NoteEvent.SetLine, { lineId, text });
}

function* askNoteCreateDraft(): AskResponse<void> {
  yield* askApplyEventDocEvent(EventDocEffect.CreateDraft, {});
}

// The doc's typed read verb — scope-blind like the writes: the enclosing bind decides
// WHICH note it reads.
const askReadNote = createEventDocStateReader<NoteState>();

// Read-to-derive-a-write: the shape every "compute from my own doc" verb takes
// (sibling orders, duplicate checks, ...). Reads the folded view through the bind.
function* askNoteAppendTitleLine(lineId: string): AskResponse<void> {
  const note = yield* askReadNote();
  yield* askApplyEventDocEvent(NoteEvent.AddLine, { lineId, text: `title: ${note.title}` });
}

// Commit then read, returning what the read saw — exercises read-your-own-writes.
function* askNoteCommitAndReadTitle(title: string): AskResponse<string> {
  yield* askApplyEventDocEvent(NoteEvent.SetTitle, { title });
  const note = yield* askReadNote();
  return note.title;
}

// Transient siblings: same domain events, but committed into a never-saved group
// keyed by transientKey (a stand-in for a websocket connection id).
function* askNoteTransientSetTitle(transientKey: string, title: string): AskResponse<void> {
  yield* askApplyTransientEventDocEvent(transientKey, NoteEvent.SetTitle, { title });
}

function* askNoteTransientAddLine(transientKey: string, lineId: string, text: string): AskResponse<void> {
  yield* askApplyTransientEventDocEvent(transientKey, NoteEvent.AddLine, { lineId, text });
}

const noteApi = {
  askNoteSetTitle,
  askNoteAddLine,
  askNoteSetLine,
  askNoteCreateDraft,
  askNoteAppendTitleLine,
  askNoteCommitAndReadTitle,
  askNoteTransientSetTitle,
  askNoteTransientAddLine,
};

const createNoteSlot = () =>
  ({
    kind: EventDocWorkspaceSlotKind.document,
    api: noteApi,
    foldReducer: noteFoldReducer,
    createInitialViewState: createInitialNoteState,
    schemaVersion: 1,
    coalesceEventTypes: [NoteEvent.SetTitle, { type: NoteEvent.SetLine, key: 'lineId' }],
  }) satisfies EventDocWorkspaceDocumentSlotConfig<NoteState, typeof noteApi>;

// ─── v2 of the note domain: the document gains `archived` via the v2 migration ──────
// Only what the accumulator-semantics spec needs; the log under test is all v1, so the
// version-routed reducer carries just the v1 handlers.

type NoteV2State = NoteState & { archived: boolean };

const createInitialNoteV2State = (): NoteV2State => ({
  ...createInitialNoteState(),
  schemaVersion: 2,
  archived: false,
});

const noteV2Migration = (state: EventDocDocument): EventDocDocument => ({ ...state, archived: false }) as NoteV2State;

const noteV2FoldReducer = buildEventDocFoldReducer<NoteV2State, NoteEffects>(createInitialNoteV2State, {
  [NoteEvent.SetTitle]: (state, payload) => ({ ...state, title: payload.data.title }),
  [NoteEvent.AddLine]: (state, payload) => ({ ...state, lines: [...state.lines, payload.data] }),
  [NoteEvent.SetLine]: (state, payload) => ({
    ...state,
    lines: state.lines.map((line) => (line.lineId === payload.data.lineId ? { ...line, text: payload.data.text } : line)),
  }),
}) as QpqReducer<NoteV2State, EventDocEvent>;

const createNoteV2Slot = () =>
  ({
    kind: EventDocWorkspaceSlotKind.document,
    api: noteApi,
    // Deliberately wider than the slot's TView: mid-fold the accumulator really is a
    // v1 NoteState (no `archived`) until the read-side migrate, hence the unknown hop.
    foldReducer: buildVersionRoutedReducer<NoteState>({
      1: noteFoldReducer,
      2: noteV2FoldReducer as unknown as QpqReducer<NoteState, EventDocEvent>,
    }) as unknown as QpqReducer<NoteV2State, EventDocEvent>,
    createInitialViewState: createInitialNoteV2State,
    schemaVersion: 2,
    migrations: { 2: noteV2Migration },
    coalesceEventTypes: [NoteEvent.SetTitle, { type: NoteEvent.SetLine, key: 'lineId' }],
  }) satisfies EventDocWorkspaceDocumentSlotConfig<NoteV2State, typeof noteApi>;

// ─── Test harness ───────────────────────────────────────────────────────────────────

const constantNow = '2026-07-16T00:00:00.000Z';

// Deterministic guid/date providers; everything else a workspace yields is handled by
// askReduceState (state) or the bind (ApplyEvent), so nothing real reaches the runtime.
// `dates` are served in commit order then fall back to the constant — the transient
// specs need crafted, distinct createdAt values (transient ordering is by time), while
// every other spec keeps its stable constant timestamp.
const createActionMocks = (dates: string[] = []): ActionMockMap => {
  let guidCount = 0;
  let dateCount = 0;

  return {
    [GuidActionType.New]: () => `guid-${++guidCount}`,
    [DateActionType.Now]: () => dates[dateCount++] ?? constantNow,
  };
};

type WorkspaceUnderTest = {
  createInitialState: () => EventDocWorkspaceState;
  reducer: QpqReducer<EventDocWorkspaceState, any>;
};

// The whole point: the workspace runs as pure story logic under askReduceState —
// no React runtime, no processors, no network.
const runWorkspaceStory = (workspace: WorkspaceUnderTest, story: () => AskResponse<void>, dates?: string[]): EventDocWorkspaceState =>
  runStory(askReduceState(workspace.createInitialState(), workspace.reducer, story), createActionMocks(dates));

const eventId = (n: number): number => n;

// Pending events carry a provisional position stamped by the reducer, so what the tests
// care about is that the buffer stays strictly ordered.
const expectStrictlyIncreasing = (events: EventDocEvent[]): void => {
  const ids = events.map((event) => event.payload.metadata.eventId);
  expect(ids).toEqual([...ids].sort((a, b) => a - b));
  expect(new Set(ids).size).toBe(ids.length);
};

// Server-stamped events for seeding histories.
const serverEvent = (type: string, data: unknown, index: number): EventDocEvent => ({
  type,
  payload: {
    data,
    metadata: {
      version: 1,
      clientMessageId: `server-${index}`,
      createdBy: { userId: 'server', userDisplayName: 'Server' },
      createdAt: '2026-07-01T00:00:00.000Z',
      eventId: eventId(index),
    },
  },
});

const initStateEvent = (index = 0): EventDocEvent => serverEvent(EventDocEffect.InitState, { id: 'doc-1', code: 'DOC', name: 'Doc' }, index);
const publishEvent = (index: number): EventDocEvent => serverEvent(EventDocEffect.Publish, {}, index);

const eventAtVersion = (event: EventDocEvent, version: number): EventDocEvent => ({
  ...event,
  payload: { ...event.payload, metadata: { ...event.payload.metadata, version } },
});

// The reference full refold the incremental historyViews maintenance must match: the
// raw ACCUMULATOR (seed + per-event steps), never final-migrated — that is the read
// side's job. Not foldEventDocLog, which climbs to the latest version at the end.
const foldNoteHistory = (events: EventDocEvent[]): NoteState => {
  let state: EventDocDocument = createInitialNoteState();

  for (const event of events) {
    [state] = foldEventDocLogStep(state, event, { reducer: noteFoldReducer, migrations: {}, latestVersion: 1 });
  }

  return state as NoteState;
};

const identityA: EventDocWorkspaceDocumentIdentity = { serviceName: 'notes', basePath: '/notes', id: 'doc-1' };

type FakeTransport = {
  transport: EventDocWorkspaceTransport;
  appended: EventDocEventInput[];
  fetchCalls: { afterEventId?: number }[];
  setServerEvents: (events: EventDocEvent[]) => void;
  setServerBase: (base: Nullable<EventDocSnapshotBase>) => void;
  failAppendOnCall: (callNumber: number, errorType?: ErrorTypeEnum) => void;
  failFetches: () => void;
};

const createFakeTransport = (initialServerEvents: EventDocEvent[] = []): FakeTransport => {
  let serverEvents = [...initialServerEvents];
  let serverBase: Nullable<EventDocSnapshotBase> = null;
  let failAppendOn: number | null = null;
  let failAppendErrorType = ErrorTypeEnum.GenericError;
  let failFetch = false;
  let appendCalls = 0;
  const appended: EventDocEventInput[] = [];
  const fetchCalls: { afterEventId?: number }[] = [];

  function* askFetchEvents(_identity: EventDocWorkspaceDocumentIdentity, afterEventId?: number): AskResponse<EventDocEvent[]> {
    fetchCalls.push({ afterEventId });

    if (failFetch) {
      return yield* askThrowError(ErrorTypeEnum.GenericError, 'fetch boom');
    }

    return serverEvents.filter((event) => afterEventId === undefined || event.payload.metadata.eventId > afterEventId);
  }

  // A single page for the history panel's newest-first walk: honours newestFirst, limit
  // and a plain index cursor — enough to exercise paging without a real store.
  function* askFetchEventsPage(
    _identity: EventDocWorkspaceDocumentIdentity,
    request?: EventDocWorkspaceEventsPageRequest,
  ): AskResponse<QpqPagedData<EventDocEvent>> {
    if (failFetch) {
      return yield* askThrowError(ErrorTypeEnum.GenericError, 'fetch boom');
    }

    const ordered = request?.newestFirst ? [...serverEvents].reverse() : [...serverEvents];
    const start = request?.nextPageKey ? Number(request.nextPageKey) : 0;
    const limit = request?.limit ?? ordered.length;
    const items = ordered.slice(start, start + limit);
    const nextIndex = start + limit;

    return { items, nextPageKey: nextIndex < ordered.length ? String(nextIndex) : undefined };
  }

  // The bootstrap read: the configured base plus the events after it (all events when
  // no base is set — the fallback the real route serves as base: null). Logged into
  // fetchCalls with the base's cursor so call sequences read the same either way.
  function* askFetchBootstrap(_identity: EventDocWorkspaceDocumentIdentity): AskResponse<EventDocWorkspaceBootstrap> {
    fetchCalls.push({ afterEventId: serverBase?.eventId });

    if (failFetch) {
      return yield* askThrowError(ErrorTypeEnum.GenericError, 'fetch boom');
    }

    return {
      base: serverBase,
      events: serverEvents.filter((event) => serverBase === null || event.payload.metadata.eventId > serverBase.eventId),
    };
  }

  function* askAppendEvent(_identity: EventDocWorkspaceDocumentIdentity, input: EventDocEventInput): AskResponse<EventDocEvent> {
    appendCalls += 1;

    if (appendCalls === failAppendOn) {
      return yield* askThrowError(failAppendErrorType, 'boom');
    }

    appended.push(input);

    const stored: EventDocEvent = {
      type: input.type,
      payload: {
        data: input.payload.data,
        metadata: {
          ...input.payload.metadata,
          createdBy: { userId: 'server', userDisplayName: 'Server' },
          createdAt: '2026-07-16T01:00:00.000Z',
          eventId: eventId(serverEvents.length),
        },
      },
    };

    serverEvents = [...serverEvents, stored];
    return stored;
  }

  return {
    transport: { askFetchBootstrap, askFetchEvents, askFetchEventsPage, askAppendEvent },
    appended,
    fetchCalls,
    setServerEvents: (events) => {
      serverEvents = [...events];
    },
    setServerBase: (base) => {
      serverBase = base;
    },
    failAppendOnCall: (callNumber, errorType = ErrorTypeEnum.GenericError) => {
      failAppendOn = callNumber;
      failAppendErrorType = errorType;
    },
    failFetches: () => {
      failFetch = true;
    },
  };
};

const createTestWorkspace = (transport?: EventDocWorkspaceTransport) =>
  createEventDocWorkspace({
    slots: {
      noteA: createNoteSlot(),
      noteB: createNoteSlot(),
    },
    transport,
  });

// ─── Scoped state: the core claim ────────────────────────────────────────────────────

describe('createEventDocWorkspace scoped state', () => {
  it('routes the SAME scope-blind api into separate slots via its binding', () => {
    const workspace = createTestWorkspace();

    function* story(): AskResponse<void> {
      yield* workspace.docs.noteA.api.askNoteSetTitle('A title');
      yield* workspace.docs.noteB.api.askNoteSetTitle('B title');
      yield* workspace.docs.noteB.api.askNoteAddLine('l1', 'first line');
    }

    const state = runWorkspaceStory(workspace, story);

    expect(state.pending.noteA).toHaveLength(1);
    expect(state.pending.noteA[0].payload.data).toEqual({ title: 'A title' });

    expect(state.pending.noteB).toHaveLength(2);
    expect(state.pending.noteB[0].payload.data).toEqual({ title: 'B title' });
    expect(state.pending.noteB[1].payload.data).toEqual({ lineId: 'l1', text: 'first line' });

    // Document commits buffer as pending; nothing lands in history without a save.
    expect(state.history.noteA).toHaveLength(0);
    expect(state.history.noteB).toHaveLength(0);
  });

  it('stamps provisional metadata from guid/date actions', () => {
    const workspace = createTestWorkspace();

    function* story(): AskResponse<void> {
      yield* workspace.docs.noteA.api.askNoteSetTitle('A title');
    }

    const state = runWorkspaceStory(workspace, story);

    expect(state.pending.noteA[0].payload.metadata).toEqual({
      version: 1,
      clientMessageId: 'guid-1',
      createdBy: { userId: '', userDisplayName: '' },
      createdAt: '2026-07-16T00:00:00.000Z',
      // Provisional: the reducer stamps the next position after everything the slot holds;
      // an empty slot's first commit is 0.
      eventId: 0,
    });
  });

  it('routes nested bound calls to the INNER binding', () => {
    const workspaceRef: { current?: ReturnType<typeof createTestWorkspace> } = {};

    // A composed verb on noteA that also drives noteB through its bound api. The raw
    // verb routes to the enclosing (noteA) bind; the bound call re-binds inward.
    function* askOuter(): AskResponse<void> {
      yield* askNoteSetTitle('outer title');
      yield* workspaceRef.current!.docs.noteB.api.askNoteSetTitle('inner title');
    }

    const workspace = createEventDocWorkspace({
      slots: {
        noteA: { ...createNoteSlot(), api: { ...noteApi, askOuter } },
        noteB: createNoteSlot(),
      },
    });
    workspaceRef.current = workspace as unknown as ReturnType<typeof createTestWorkspace>;

    function* story(): AskResponse<void> {
      yield* workspace.docs.noteA.api.askOuter();
    }

    const state = runWorkspaceStory(workspace, story);

    expect(state.pending.noteA).toHaveLength(1);
    expect(state.pending.noteA[0].payload.data).toEqual({ title: 'outer title' });
    expect(state.pending.noteB).toHaveLength(1);
    expect(state.pending.noteB[0].payload.data).toEqual({ title: 'inner title' });
  });

  it('routes parallel commits (askRunParallel batches) without losing events', () => {
    const workspace = createTestWorkspace();
    const lineEntries: [string, string][] = [
      ['l1', 'one'],
      ['l2', 'two'],
    ];

    const addLineStoryForEntry = ([lineId, text]: [string, string]) => workspace.docs.noteA.api.askNoteAddLine(lineId, text);

    function* story(): AskResponse<void> {
      yield* askMapParallel(lineEntries, addLineStoryForEntry);
    }

    const state = runWorkspaceStory(workspace, story);

    expect(state.pending.noteA).toHaveLength(2);
    expect(state.pending.noteA.map((event) => (event.payload.data as NoteLine).lineId).sort()).toEqual(['l1', 'l2']);
    expectStrictlyIncreasing(state.pending.noteA);
  });

  it('fails loudly when a document verb runs outside any workspace bind', () => {
    const workspace = createTestWorkspace();

    function* story(): AskResponse<void> {
      yield* askNoteSetTitle('nowhere to go');
    }

    expect(() => runWorkspaceStory(workspace, story)).toThrow(/ApplyEvent/);
  });
});

// ─── Declarative reads: askEventDocReadState through the bind ───────────────────────

describe('createEventDocWorkspace declarative reads', () => {
  it("answers a bound read with the slot's folded view (history + pending)", () => {
    const workspace = createTestWorkspace();

    function* story(): AskResponse<void> {
      yield* askUIEventDocWorkspaceSetHistoryEvents('noteA', [initStateEvent(0), serverEvent(NoteEvent.SetTitle, { title: 'Saved title' }, 1)]);
      yield* workspace.docs.noteA.api.askNoteAppendTitleLine('l1');
    }

    const state = runWorkspaceStory(workspace, story);

    // The verb's read saw the fold of the SAVED history, and its derived write landed
    // in its own slot's pending buffer.
    expect(state.pending.noteA).toHaveLength(1);
    expect(state.pending.noteA[0].payload.data).toEqual({ lineId: 'l1', text: 'title: Saved title' });
  });

  it('routes the SAME read verb to each slot via its binding', () => {
    const workspace = createTestWorkspace();

    function* story(): AskResponse<void> {
      yield* workspace.docs.noteA.api.askNoteSetTitle('A title');
      yield* workspace.docs.noteB.api.askNoteSetTitle('B title');
      yield* workspace.docs.noteA.api.askNoteAppendTitleLine('l1');
      yield* workspace.docs.noteB.api.askNoteAppendTitleLine('l1');
    }

    const state = runWorkspaceStory(workspace, story);

    expect(state.pending.noteA.at(-1)?.payload.data).toEqual({ lineId: 'l1', text: 'title: A title' });
    expect(state.pending.noteB.at(-1)?.payload.data).toEqual({ lineId: 'l1', text: 'title: B title' });
  });

  it('read-your-own-writes: a commit earlier in the story is visible to the read', () => {
    const workspace = createTestWorkspace();
    let readTitle = '';

    function* story(): AskResponse<void> {
      readTitle = yield* workspace.docs.noteA.api.askNoteCommitAndReadTitle('just committed');
    }

    runWorkspaceStory(workspace, story);

    expect(readTitle).toBe('just committed');
  });

  it('fails loudly when a read runs outside any workspace bind', () => {
    const workspace = createTestWorkspace();

    function* story(): AskResponse<void> {
      yield* askEventDocReadState();
    }

    expect(() => runWorkspaceStory(workspace, story)).toThrow(/ReadState/);
  });

  it('answers a bound identity read: null before init, the slot identity after', () => {
    const fake = createFakeTransport([initStateEvent()]);
    const identities: unknown[] = [];

    // Bound through noteA below, so the raw ask resolves against noteA's slot.
    function* askCaptureIdentity(): AskResponse<void> {
      identities.push(yield* askEventDocReadIdentity());
    }

    const captureWorkspace = createEventDocWorkspace({
      slots: {
        noteA: { ...createNoteSlot(), api: { ...noteApi, askCaptureIdentity } },
        noteB: createNoteSlot(),
      },
      transport: fake.transport,
    });

    function* story(): AskResponse<void> {
      yield* captureWorkspace.docs.noteA.api.askCaptureIdentity();
      yield* captureWorkspace.api.askInit({ noteA: identityA });
      yield* captureWorkspace.docs.noteA.api.askCaptureIdentity();
    }

    runWorkspaceStory(captureWorkspace, story);

    expect(identities).toEqual([null, identityA]);
  });
});

// ─── Coalescing + renumbering ────────────────────────────────────────────────────────

describe('createEventDocWorkspace coalescing', () => {
  it('collapses a burst of a one-per-type event into the latest', () => {
    const workspace = createTestWorkspace();

    function* story(): AskResponse<void> {
      yield* workspace.docs.noteA.api.askNoteSetTitle('one');
      yield* workspace.docs.noteA.api.askNoteSetTitle('two');
      yield* workspace.docs.noteA.api.askNoteSetTitle('three');
    }

    const state = runWorkspaceStory(workspace, story);

    expect(state.pending.noteA).toHaveLength(1);
    expect(state.pending.noteA[0].payload.data).toEqual({ title: 'three' });
  });

  it('coalesces per item for { type, key } rules', () => {
    const workspace = createTestWorkspace();

    function* story(): AskResponse<void> {
      yield* workspace.docs.noteA.api.askNoteSetLine('l1', 'first draft');
      yield* workspace.docs.noteA.api.askNoteSetLine('l2', 'other line');
      yield* workspace.docs.noteA.api.askNoteSetLine('l1', 'final');
    }

    const state = runWorkspaceStory(workspace, story);

    // l1's earlier edit is superseded; l2's is untouched.
    expect(state.pending.noteA).toHaveLength(2);
    expect(state.pending.noteA[0].payload.data).toEqual({ lineId: 'l2', text: 'other line' });
    expect(state.pending.noteA[1].payload.data).toEqual({ lineId: 'l1', text: 'final' });
  });

  it('keeps pending events ordered after the saved log without renumbering', () => {
    const workspace = createTestWorkspace();

    function* story(): AskResponse<void> {
      yield* askUIEventDocWorkspaceSetHistoryEvents('noteA', [initStateEvent()]);
      yield* workspace.docs.noteA.api.askNoteSetTitle('one');
      yield* workspace.docs.noteA.api.askNoteAddLine('l1', 'line');
      yield* workspace.docs.noteA.api.askNoteSetTitle('two'); // coalesces away 'one'
    }

    const state = runWorkspaceStory(workspace, story);

    expectStrictlyIncreasing(state.pending.noteA);
  });

  it('local slots default to last-write-wins per type, buffered in pending', () => {
    const workspace = createTestWorkspace();

    function* story(): AskResponse<void> {
      yield* workspace.docs.chrome.api.askChromeSetHistoryOpen(true);
      yield* workspace.docs.chrome.api.askChromeSetHistoryOpen(false);
      yield* workspace.docs.chrome.api.askChromeSetHelpOpen(true);
    }

    const state = runWorkspaceStory(workspace, story);

    // Local commits buffer in pending like everything else (they just never save), so
    // history stays strictly server truth: empty. One pending event per type.
    expect(state.history.chrome).toHaveLength(0);
    expect(state.pending.chrome).toHaveLength(2);
    expectStrictlyIncreasing(state.pending.chrome);

    const chromeView = workspace.docs.chrome.view(state);
    expect(chromeView.historyOpen).toBe(false);
    expect(chromeView.helpOpen).toBe(true);
  });

  it('coalescing across a version boundary keeps the tail monotonic', () => {
    // Post-hot-swap shape: a restored v1 SetTitle sits in pending when the v2 module
    // commits a fresh SetTitle. The coalesce removes the v1 event and appends the v2
    // one at the END, so the buffer never interleaves a newer version before an
    // older one — the live-view fold's non-decreasing rule holds by construction.
    const workspace = createEventDocWorkspace({ slots: { noteA: createNoteV2Slot() } });

    function* story(): AskResponse<void> {
      yield* askUIEventDocWorkspaceSetHistoryEvents('noteA', [initStateEvent()]);
      yield* askUIEventDocWorkspaceSetPendingEvents('noteA', [
        serverEvent(NoteEvent.SetTitle, { title: 'restored v1 title' }, 1),
        serverEvent(NoteEvent.AddLine, { lineId: 'l1', text: 'restored v1 line' }, 2),
      ]);
      yield* workspace.docs.noteA.api.askNoteSetTitle('fresh v2 title');
    }

    const state = runWorkspaceStory(workspace, story);

    expect(state.pending.noteA.map((event) => event.payload.metadata.version)).toEqual([1, 2]);
    expect(state.pending.noteA[0].payload.data).toEqual({ lineId: 'l1', text: 'restored v1 line' });
    expect(state.pending.noteA[1].payload.data).toEqual({ title: 'fresh v2 title' });

    const view = workspace.docs.noteA.view(state);
    expect(view.title).toBe('fresh v2 title');
    expect(view.lines).toEqual([{ lineId: 'l1', text: 'restored v1 line' }]);
  });
});

// ─── Validation ──────────────────────────────────────────────────────────────────────

describe('createEventDocWorkspace validation', () => {
  it('applies the default lifecycle guard: a published document rejects edits', () => {
    const workspace = createTestWorkspace();

    function* story(): AskResponse<void> {
      yield* askUIEventDocWorkspaceSetHistoryEvents('noteA', [initStateEvent(0), publishEvent(1)]);
      yield* workspace.docs.noteA.api.askNoteSetTitle('should be rejected');
    }

    const state = runWorkspaceStory(workspace, story);

    expect(state.pending.noteA).toHaveLength(0);
    expect(state.slots.noteA.error?.operation).toBe(EventDocWorkspaceSlotOperation.validation);
    expect(state.slots.noteA.error?.error.errorType).toBe(ErrorTypeEnum.Invalid);
  });

  it('allows CREATE_DRAFT on a published document and clears the error', () => {
    const workspace = createTestWorkspace();

    function* story(): AskResponse<void> {
      yield* askUIEventDocWorkspaceSetHistoryEvents('noteA', [initStateEvent(0), publishEvent(1)]);
      yield* workspace.docs.noteA.api.askNoteSetTitle('rejected'); // sets the validation error
      yield* workspace.docs.noteA.api.askNoteCreateDraft();
    }

    const state = runWorkspaceStory(workspace, story);

    expect(state.pending.noteA).toHaveLength(1);
    expect(state.pending.noteA[0].type).toBe(EventDocEffect.CreateDraft);
    // The successful commit wipes the earlier rejection via the ClearError effect.
    expect(state.slots.noteA.error).toBeNull();
  });

  it('runs a configured domain validator instead of the default', () => {
    const rejectEmptyTitle: EventDocEditorValidator = (event) =>
      event.type === NoteEvent.SetTitle && !(event.payload.data as { title: string }).title ? 'Title required' : null;

    const workspace = createEventDocWorkspace({
      slots: {
        noteA: { ...createNoteSlot(), validate: rejectEmptyTitle },
      },
    });

    function* story(): AskResponse<void> {
      yield* workspace.docs.noteA.api.askNoteSetTitle('');
    }

    const state = runWorkspaceStory(workspace, story);

    expect(state.pending.noteA).toHaveLength(0);
    expect(state.slots.noteA.error).toEqual({
      operation: EventDocWorkspaceSlotOperation.validation,
      error: { errorType: ErrorTypeEnum.Invalid, errorText: 'Title required' },
    });
  });
});

// ─── Built-in verbs: init / save / refresh / cancel ─────────────────────────────────

describe('createEventDocWorkspace built-in verbs', () => {
  it('init loads the saved log and seeds the document identity', () => {
    const fake = createFakeTransport([initStateEvent()]);
    const workspace = createTestWorkspace(fake.transport);

    function* story(): AskResponse<void> {
      yield* workspace.api.askInit({ noteA: identityA });
    }

    const state = runWorkspaceStory(workspace, story);

    expect(state.history.noteA).toHaveLength(1);
    expect(state.slots.noteA.documentIdentity).toEqual(identityA);
    expect(state.slots.noteA.isLoading).toBe(false);
    expect(state.slots.noteA.error).toBeNull();

    // noteB was not initialised; untouched.
    expect(state.history.noteB).toHaveLength(0);
    expect(state.slots.noteB.documentIdentity).toBeNull();
  });

  it('init failure surfaces as slot error state', () => {
    const fake = createFakeTransport();
    fake.failFetches();
    const workspace = createTestWorkspace(fake.transport);

    function* story(): AskResponse<void> {
      yield* workspace.api.askInit({ noteA: identityA });
    }

    const state = runWorkspaceStory(workspace, story);

    // The caught transport error passes through untouched: typed, not flattened.
    expect(state.slots.noteA.error?.operation).toBe(EventDocWorkspaceSlotOperation.load);
    expect(state.slots.noteA.error?.error.errorType).toBe(ErrorTypeEnum.GenericError);
    expect(state.slots.noteA.error?.error.errorText).toBe('fetch boom');
    expect(state.slots.noteA.isLoading).toBe(false);
    expect(state.history.noteA).toHaveLength(0);
  });

  it('save streams pending into history one event at a time', () => {
    const fake = createFakeTransport([initStateEvent()]);
    const workspace = createTestWorkspace(fake.transport);

    function* story(): AskResponse<void> {
      yield* workspace.api.askInit({ noteA: identityA });
      yield* workspace.docs.noteA.api.askNoteAddLine('l1', 'one');
      yield* workspace.docs.noteA.api.askNoteAddLine('l2', 'two');
      yield* workspace.api.askSave();
    }

    const state = runWorkspaceStory(workspace, story);

    expect(fake.appended).toHaveLength(2);
    // Only the client-owned fields go over the wire.
    expect(fake.appended[0].payload.metadata).toEqual({ version: 1, clientMessageId: 'guid-1' });

    expect(state.pending.noteA).toHaveLength(0);
    expect(state.history.noteA).toHaveLength(3);
    // Server-stamped metadata replaces the provisional buffer metadata.
    expect(state.history.noteA[1].payload.metadata.createdBy.userId).toBe('server');
    expect(state.history.noteA[1].payload.metadata.eventId).toBe(eventId(1));
    expect(state.slots.noteA.isSaving).toBe(false);
  });

  it('an interrupted save leaves exactly the unsaved tail pending', () => {
    const fake = createFakeTransport([initStateEvent()]);
    fake.failAppendOnCall(2);
    const workspace = createTestWorkspace(fake.transport);

    function* story(): AskResponse<void> {
      yield* workspace.api.askInit({ noteA: identityA });
      yield* workspace.docs.noteA.api.askNoteAddLine('l1', 'one');
      yield* workspace.docs.noteA.api.askNoteAddLine('l2', 'two');
      yield* workspace.api.askSave();
    }

    const state = runWorkspaceStory(workspace, story);

    expect(state.history.noteA).toHaveLength(2); // init + first line
    expect(state.pending.noteA).toHaveLength(1);
    expect(state.pending.noteA[0].payload.data).toEqual({ lineId: 'l2', text: 'two' });
    expect(state.slots.noteA.error?.operation).toBe(EventDocWorkspaceSlotOperation.save);
    expect(state.slots.noteA.error?.error.errorType).toBe(ErrorTypeEnum.GenericError);
    expect(state.slots.noteA.error?.error.errorText).toBe('boom');
    expect(state.slots.noteA.isSaving).toBe(false);
  });

  it('a save failure preserves the transport error type', () => {
    const fake = createFakeTransport([initStateEvent()]);
    fake.failAppendOnCall(1, ErrorTypeEnum.NotFound);
    const workspace = createTestWorkspace(fake.transport);

    function* story(): AskResponse<void> {
      yield* workspace.api.askInit({ noteA: identityA });
      yield* workspace.docs.noteA.api.askNoteAddLine('l1', 'one');
      yield* workspace.api.askSave();
    }

    const state = runWorkspaceStory(workspace, story);

    // The original errorType survives the channel; consumers can branch on it.
    expect(state.slots.noteA.error?.operation).toBe(EventDocWorkspaceSlotOperation.save);
    expect(state.slots.noteA.error?.error.errorType).toBe(ErrorTypeEnum.NotFound);
    expect(state.pending.noteA).toHaveLength(1);
  });

  it('refresh tail-pulls only the events after the last held index', () => {
    const fake = createFakeTransport([initStateEvent()]);
    const workspace = createTestWorkspace(fake.transport);

    // The server log grows between init and refresh (another editor appended), so the
    // refresh must fetch from afterEventId 0 and append only the tail.
    function* story(): AskResponse<void> {
      yield* workspace.api.askInit({ noteA: identityA });
      fake.setServerEvents([initStateEvent(), serverEvent(NoteEvent.SetTitle, { title: 'from elsewhere' }, 1)]);
      yield* workspace.api.askRefresh('noteA');
    }

    const state = runWorkspaceStory(workspace, story);

    expect(fake.fetchCalls).toEqual([{ afterEventId: undefined }, { afterEventId: eventId(0) }]);
    expect(state.history.noteA).toHaveLength(2);
    expect(state.history.noteA[1].payload.data).toEqual({ title: 'from elsewhere' });
  });

  it('init seeds the fold from a server snapshot base and holds only the tail', () => {
    const allEvents = [
      initStateEvent(),
      serverEvent(NoteEvent.SetTitle, { title: 'snapped title' }, 1),
      serverEvent(NoteEvent.AddLine, { lineId: 'l1', text: 'after the snapshot' }, 2),
    ];
    // The base is what the server's snapshot store holds: the era-pinned fold of the
    // log up to the snapshot event.
    const base: EventDocSnapshotBase = { eventId: eventId(1), state: foldNoteHistory(allEvents.slice(0, 2)) };

    const fake = createFakeTransport(allEvents);
    fake.setServerBase(base);
    const workspace = createTestWorkspace(fake.transport);

    function* story(): AskResponse<void> {
      yield* workspace.api.askInit({ noteA: identityA });
    }

    const state = runWorkspaceStory(workspace, story);

    // Only the tail crossed the wire and is held; the base fills in the rest.
    expect(state.history.noteA.map((event) => event.payload.metadata.eventId)).toEqual([eventId(2)]);
    expect(state.bases.noteA).toEqual(base);

    // Resuming from the base equals folding the whole log from scratch.
    expect(state.historyViews.noteA).toEqual(foldNoteHistory(allEvents));

    const view = workspace.docs.noteA.view(state);
    expect(view.title).toBe('snapped title');
    expect(view.lines).toEqual([{ lineId: 'l1', text: 'after the snapshot' }]);
  });

  it('refresh on a bootstrap-loaded slot with an empty tail cursors from the base, not event zero', () => {
    const baseEvents = [initStateEvent(), serverEvent(NoteEvent.SetTitle, { title: 'snapped' }, 1)];
    const base: EventDocSnapshotBase = { eventId: eventId(1), state: foldNoteHistory(baseEvents) };

    // The snapshot is current: nothing after it, so the slot holds NO events at all.
    const fake = createFakeTransport(baseEvents);
    fake.setServerBase(base);
    const workspace = createTestWorkspace(fake.transport);

    function* story(): AskResponse<void> {
      yield* workspace.api.askInit({ noteA: identityA });
      fake.setServerEvents([...baseEvents, serverEvent(NoteEvent.AddLine, { lineId: 'l1', text: 'from elsewhere' }, 2)]);
      yield* workspace.api.askRefresh('noteA');
    }

    const state = runWorkspaceStory(workspace, story);

    // Both calls cursor from the base's event — never a full refetch.
    expect(fake.fetchCalls).toEqual([{ afterEventId: eventId(1) }, { afterEventId: eventId(1) }]);
    expect(state.history.noteA).toHaveLength(1);
    expect(workspace.docs.noteA.view(state).lines).toEqual([{ lineId: 'l1', text: 'from elsewhere' }]);
  });

  it('a runtime snapshot carries the fold base and restores it with the partial history', () => {
    const allEvents = [initStateEvent(), serverEvent(NoteEvent.SetTitle, { title: 'snapped' }, 1)];
    const base: EventDocSnapshotBase = { eventId: eventId(0), state: foldNoteHistory(allEvents.slice(0, 1)) };

    const fake = createFakeTransport(allEvents);
    fake.setServerBase(base);
    const workspace = createTestWorkspace(fake.transport);

    function* editSession(): AskResponse<void> {
      yield* workspace.api.askInit({ noteA: identityA });
      yield* workspace.docs.noteA.api.askNoteAddLine('l1', 'unsaved');
    }

    const snapshot = workspace.createSnapshot(runWorkspaceStory(workspace, editSession));

    // The snapshot's history is partial (post-base only) — the base must ride along.
    expect(snapshot.slots.noteA.history).toHaveLength(1);
    expect(snapshot.slots.noteA.base).toEqual(base);

    function* swappedSession(): AskResponse<void> {
      yield* workspace.api.askInit({ noteA: identityA }, snapshot);
    }

    const state = runWorkspaceStory(workspace, swappedSession);

    // Restored partial history refolds from the restored base, not from pristine.
    expect(state.bases.noteA).toEqual(base);
    const view = workspace.docs.noteA.view(state);
    expect(view.title).toBe('snapped');
    expect(view.lines).toEqual([{ lineId: 'l1', text: 'unsaved' }]);
  });

  it('the history panel pages the saved log newest-first and walks older on demand', () => {
    // 60 saved events: one page (50) plus a tail, so the cursor genuinely continues.
    const manyEvents = [initStateEvent(), ...Array.from({ length: 59 }, (_, i) => serverEvent(NoteEvent.SetTitle, { title: `t${i + 1}` }, i + 1))];

    const firstPageOnly = (() => {
      const fake = createFakeTransport(manyEvents);
      const workspace = createTestWorkspace(fake.transport);

      function* story(): AskResponse<void> {
        yield* workspace.api.askInit({ noteA: identityA });
        yield* workspace.api.askLoadHistory('noteA');
      }

      return runWorkspaceStory(workspace, story).fullHistory.noteA!;
    })();

    expect(firstPageOnly.events).toHaveLength(50);
    // Newest first: the panel shows the latest change at the top without reversing.
    expect(firstPageOnly.events[0].payload.metadata.eventId).toBe(eventId(59));
    expect(firstPageOnly.nextPageKey).toBeDefined();

    const walkedOlder = (() => {
      const fake = createFakeTransport(manyEvents);
      const workspace = createTestWorkspace(fake.transport);

      function* story(): AskResponse<void> {
        yield* workspace.api.askInit({ noteA: identityA });
        yield* workspace.api.askLoadHistory('noteA');
        yield* workspace.api.askLoadOlderHistory('noteA');
        // A walk past the log's beginning is a no-op, not an error.
        yield* workspace.api.askLoadOlderHistory('noteA');
      }

      return runWorkspaceStory(workspace, story).fullHistory.noteA!;
    })();

    expect(walkedOlder.events).toHaveLength(60);
    expect(walkedOlder.events[59].payload.metadata.eventId).toBe(eventId(0));
    expect(walkedOlder.nextPageKey).toBeUndefined();
  });

  it('cancel discards pending and leaves history untouched', () => {
    const fake = createFakeTransport([initStateEvent()]);
    const workspace = createTestWorkspace(fake.transport);

    function* story(): AskResponse<void> {
      yield* workspace.api.askInit({ noteA: identityA });
      yield* workspace.docs.noteA.api.askNoteSetTitle('discard me');
      yield* workspace.api.askCancel();
    }

    const state = runWorkspaceStory(workspace, story);

    expect(state.pending.noteA).toHaveLength(0);
    expect(state.history.noteA).toHaveLength(1);
    expect(state.slots.noteA.error).toBeNull();
  });

  it('cancel clears document slots only; chrome pending survives', () => {
    const fake = createFakeTransport([initStateEvent()]);
    const workspace = createTestWorkspace(fake.transport);

    function* story(): AskResponse<void> {
      yield* workspace.api.askInit({ noteA: identityA });
      yield* workspace.docs.noteA.api.askNoteSetTitle('discard me');
      yield* workspace.docs.chrome.api.askChromeSetHelpOpen(true);
      yield* workspace.api.askCancel();
    }

    const state = runWorkspaceStory(workspace, story);

    // Local pending (tabs, panels) is session state, not an unsaved edit; Cancel
    // only discards document drafts.
    expect(state.pending.noteA).toHaveLength(0);
    expect(state.pending.chrome).toHaveLength(1);
    expect(workspace.docs.chrome.view(state).helpOpen).toBe(true);
  });

  it('transport verbs fail loudly on a transportless workspace', () => {
    const workspace = createTestWorkspace();

    function* story(): AskResponse<void> {
      yield* workspace.api.askSave();
    }

    expect(() => runWorkspaceStory(workspace, story)).toThrow(/transport/);
  });
});

// ─── Snapshot hand-off: pending carried across runtimes ─────────────────────────────

describe('createEventDocWorkspace snapshot hand-off', () => {
  it('captures document identity + pending, and local slot streams', () => {
    const fake = createFakeTransport([initStateEvent()]);
    const workspace = createTestWorkspace(fake.transport);

    function* story(): AskResponse<void> {
      yield* workspace.api.askInit({ noteA: identityA });
      yield* workspace.docs.noteA.api.askNoteSetTitle('unsaved');
      yield* workspace.docs.chrome.api.askChromeSetHelpOpen(true);
    }

    const snapshot = workspace.createSnapshot(runWorkspaceStory(workspace, story));

    // noteB was never initialised — documents without an identity don't snapshot.
    expect(Object.keys(snapshot.slots)).toEqual(['noteA']);
    expect(snapshot.slots.noteA.documentIdentity).toEqual(identityA);
    expect(snapshot.slots.noteA.pending).toHaveLength(1);
    expect(snapshot.slots.noteA.pending[0].payload.data).toEqual({ title: 'unsaved' });

    // chrome is local: its pending stream IS its session state, carried wholesale.
    expect(Object.keys(snapshot.localSlots ?? {})).toEqual(['chrome']);
    expect(snapshot.localSlots?.chrome).toHaveLength(1);
  });

  it('init restores local slot streams: the session experience survives a swap', () => {
    const fake = createFakeTransport([initStateEvent()]);
    const workspace = createTestWorkspace(fake.transport);

    function* editSession(): AskResponse<void> {
      yield* workspace.api.askInit({ noteA: identityA });
      yield* workspace.docs.chrome.api.askChromeSetHelpOpen(true);
    }

    const snapshot = workspace.createSnapshot(runWorkspaceStory(workspace, editSession));

    function* swappedSession(): AskResponse<void> {
      yield* workspace.api.askInit({ noteA: identityA }, snapshot);
    }

    const state = runWorkspaceStory(workspace, swappedSession);

    expect(state.pending.chrome).toHaveLength(1);
    expect(workspace.docs.chrome.view(state).helpOpen).toBe(true);
    // Local session state never dirties the workspace.
    expect(workspace.selectors.isDirty(state)).toBe(false);
  });

  it('a snapshot without localSlots (older bundle) restores documents and nothing else', () => {
    const fake = createFakeTransport([initStateEvent()]);
    const workspace = createTestWorkspace(fake.transport);

    function* editSession(): AskResponse<void> {
      yield* workspace.api.askInit({ noteA: identityA });
      yield* workspace.docs.noteA.api.askNoteSetTitle('carried');
    }

    const { slots } = workspace.createSnapshot(runWorkspaceStory(workspace, editSession));

    function* swappedSession(): AskResponse<void> {
      yield* workspace.api.askInit({ noteA: identityA }, { slots });
    }

    const state = runWorkspaceStory(workspace, swappedSession);

    expect(state.pending.noteA).toHaveLength(1);
    expect(state.pending.chrome).toHaveLength(0);
  });

  it('init restores a full snapshot instantly: history + pending seed with no loading, then a tail-pull syncs the delta', () => {
    const fake = createFakeTransport([initStateEvent()]);
    const workspace = createTestWorkspace(fake.transport);

    function* editSession(): AskResponse<void> {
      yield* workspace.api.askInit({ noteA: identityA });
      yield* workspace.docs.noteA.api.askNoteSetTitle('carried title');
      yield* workspace.docs.noteA.api.askNoteAddLine('l1', 'carried line');
    }

    const snapshot = workspace.createSnapshot(runWorkspaceStory(workspace, editSession));
    expect(snapshot.slots.noteA.history).toHaveLength(1);

    // The server log grew between the runtimes (another editor appended): the
    // restore must NOT full-fetch — only the tail after the snapshot's last event.
    fake.setServerEvents([initStateEvent(), serverEvent(NoteEvent.SetTitle, { title: 'from elsewhere' }, 1)]);

    function* swappedSession(): AskResponse<void> {
      yield* workspace.api.askInit({ noteA: identityA }, snapshot);
    }

    const state = runWorkspaceStory(workspace, swappedSession);

    // First call is the edit session's full load; the restore adds ONLY a tail-pull.
    expect(fake.fetchCalls).toEqual([{ afterEventId: undefined }, { afterEventId: eventId(0) }]);
    expect(state.slots.noteA.isLoading).toBe(false);

    expect(state.history.noteA).toHaveLength(2);
    expect(state.pending.noteA).toHaveLength(2);
    expectStrictlyIncreasing(state.pending.noteA);
    expect(workspace.selectors.isDirty(state)).toBe(true);

    // The unsaved SetTitle still folds after the synced tail: client intent wins.
    const view = workspace.docs.noteA.view(state);
    expect(view.title).toBe('carried title');
    expect(view.lines).toEqual([{ lineId: 'l1', text: 'carried line' }]);
  });

  it('a snapshot slot without history falls back to the blocking full load', () => {
    const fake = createFakeTransport([initStateEvent()]);
    const workspace = createTestWorkspace(fake.transport);

    function* editSession(): AskResponse<void> {
      yield* workspace.api.askInit({ noteA: identityA });
      yield* workspace.docs.noteA.api.askNoteSetTitle('carried');
    }

    const snapshot = workspace.createSnapshot(runWorkspaceStory(workspace, editSession));
    // The caller's force-refetch knob (also the shape older bundles export).
    const { history: _stripped, ...slotWithoutHistory } = snapshot.slots.noteA;

    function* swappedSession(): AskResponse<void> {
      yield* workspace.api.askInit({ noteA: identityA }, { slots: { noteA: slotWithoutHistory } });
    }

    const state = runWorkspaceStory(workspace, swappedSession);

    // Two FULL loads — no tail-pull.
    expect(fake.fetchCalls).toEqual([{ afterEventId: undefined }, { afterEventId: undefined }]);
    expect(state.history.noteA).toHaveLength(1);
    expect(state.pending.noteA).toHaveLength(1);
    expect(state.pending.noteA[0].payload.data).toEqual({ title: 'carried' });
  });

  it('restored pending saves through the normal pipeline, in order', () => {
    const fake = createFakeTransport([initStateEvent()]);
    const workspace = createTestWorkspace(fake.transport);

    function* editSession(): AskResponse<void> {
      yield* workspace.api.askInit({ noteA: identityA });
      yield* workspace.docs.noteA.api.askNoteAddLine('l1', 'one');
      yield* workspace.docs.noteA.api.askNoteAddLine('l2', 'two');
    }

    const snapshot = workspace.createSnapshot(runWorkspaceStory(workspace, editSession));

    function* swappedSession(): AskResponse<void> {
      yield* workspace.api.askInit({ noteA: identityA }, snapshot);
      yield* workspace.api.askSave();
    }

    const state = runWorkspaceStory(workspace, swappedSession);

    expect(fake.appended.map((input) => input.payload.data)).toEqual([
      { lineId: 'l1', text: 'one' },
      { lineId: 'l2', text: 'two' },
    ]);
    expect(state.pending.noteA).toHaveLength(0);
    expect(state.history.noteA).toHaveLength(3);
  });

  it('drops snapshot pending when the identity does not match: intent never leaks across documents', () => {
    const fake = createFakeTransport([initStateEvent()]);
    const workspace = createTestWorkspace(fake.transport);

    function* editSession(): AskResponse<void> {
      yield* workspace.api.askInit({ noteA: identityA });
      yield* workspace.docs.noteA.api.askNoteSetTitle('doc-1 edit');
    }

    const snapshot = workspace.createSnapshot(runWorkspaceStory(workspace, editSession));

    function* otherDocSession(): AskResponse<void> {
      yield* workspace.api.askInit({ noteA: { ...identityA, id: 'doc-2' } }, snapshot);
    }

    const state = runWorkspaceStory(workspace, otherDocSession);

    expect(state.pending.noteA).toHaveLength(0);
  });

  it('a failed restore fetch keeps the restored pending: intent survives the error', () => {
    const editFake = createFakeTransport([initStateEvent()]);
    const workspace = createTestWorkspace(editFake.transport);

    function* editSession(): AskResponse<void> {
      yield* workspace.api.askInit({ noteA: identityA });
      yield* workspace.docs.noteA.api.askNoteSetTitle('precious');
    }

    const snapshot = workspace.createSnapshot(runWorkspaceStory(workspace, editSession));

    const failingFake = createFakeTransport();
    failingFake.failFetches();
    const swappedWorkspace = createTestWorkspace(failingFake.transport);

    function* swappedSession(): AskResponse<void> {
      yield* swappedWorkspace.api.askInit({ noteA: identityA }, snapshot);
    }

    const state = runWorkspaceStory(swappedWorkspace, swappedSession);

    expect(state.slots.noteA.error?.operation).toBe(EventDocWorkspaceSlotOperation.load);
    expect(state.pending.noteA).toHaveLength(1);
    expect(state.pending.noteA[0].payload.data).toEqual({ title: 'precious' });
  });
});

// ─── historyViews: the stored fold ───────────────────────────────────────────────────

describe('createEventDocWorkspace historyViews', () => {
  it('seeds each slot with its initial view state', () => {
    const workspace = createTestWorkspace();
    const state = workspace.createInitialState();

    expect(state.historyViews.noteA).toEqual(createInitialNoteState());
    expect(state.historyViews.noteB).toEqual(createInitialNoteState());
    expect(state.historyViews.chrome).toEqual({ historyOpen: false, helpOpen: false, historySlotKey: null });
  });

  it('init full-folds the loaded log into the stored view', () => {
    const fake = createFakeTransport([initStateEvent(0), serverEvent(NoteEvent.SetTitle, { title: 'Loaded' }, 1)]);
    const workspace = createTestWorkspace(fake.transport);

    function* story(): AskResponse<void> {
      yield* workspace.api.askInit({ noteA: identityA });
    }

    const state = runWorkspaceStory(workspace, story);

    expect(state.historyViews.noteA).toEqual(foldNoteHistory(state.history.noteA));
    expect((state.historyViews.noteA as NoteState).title).toBe('Loaded');
  });

  it('save landings fold incrementally and match a full refold of the final history', () => {
    const fake = createFakeTransport([initStateEvent()]);
    const workspace = createTestWorkspace(fake.transport);

    function* story(): AskResponse<void> {
      yield* workspace.api.askInit({ noteA: identityA });
      yield* workspace.docs.noteA.api.askNoteAddLine('l1', 'one');
      yield* workspace.docs.noteA.api.askNoteAddLine('l2', 'two');
      yield* workspace.api.askSave();
    }

    const state = runWorkspaceStory(workspace, story);

    expect(state.history.noteA).toHaveLength(3);
    expect(state.historyViews.noteA).toEqual(foldNoteHistory(state.history.noteA));
    expect((state.historyViews.noteA as NoteState).lines).toEqual([
      { lineId: 'l1', text: 'one' },
      { lineId: 'l2', text: 'two' },
    ]);
  });

  it('refresh folds only the fetched tail into the stored view', () => {
    const fake = createFakeTransport([initStateEvent()]);
    const workspace = createTestWorkspace(fake.transport);

    function* story(): AskResponse<void> {
      yield* workspace.api.askInit({ noteA: identityA });
      fake.setServerEvents([initStateEvent(), serverEvent(NoteEvent.SetTitle, { title: 'from elsewhere' }, 1)]);
      yield* workspace.api.askRefresh('noteA');
    }

    const state = runWorkspaceStory(workspace, story);

    // The tail-pull appended (not re-set) the log, and the incremental fold matches
    // the reference full refold.
    expect(fake.fetchCalls).toEqual([{ afterEventId: undefined }, { afterEventId: eventId(0) }]);
    expect((state.historyViews.noteA as NoteState).title).toBe('from elsewhere');
    expect(state.historyViews.noteA).toEqual(foldNoteHistory(state.history.noteA));
  });

  it('an all-old-version log stores the raw accumulator; refresh tails at that version fold fine; the view reads latest', () => {
    // The regression this revision fixes: the whole saved log is authored at v1
    // inside a slot whose latest is v2. Storing a latest-migrated view used to
    // force the doc to v2 at init, and the (perfectly valid) v1 refresh tail then
    // tripped the below-version guard. The accumulator folds it naturally.
    const workspace = createEventDocWorkspace({ slots: { noteA: createNoteV2Slot() } });

    function* story(): AskResponse<void> {
      yield* askUIEventDocWorkspaceSetHistoryEvents('noteA', [initStateEvent(0), serverEvent(NoteEvent.SetTitle, { title: 'Old doc' }, 1)]);
      yield* askUIEventDocWorkspaceAppendHistoryEvent('noteA', serverEvent(NoteEvent.AddLine, { lineId: 'l1', text: 'still v1' }, 2));
    }

    const state = runWorkspaceStory(workspace, story);

    // The stored view is the raw accumulator: still at the log's authored version,
    // unmigrated (no `archived` yet).
    const accumulator = state.historyViews.noteA as NoteV2State;
    expect(accumulator.schemaVersion).toBe(1);
    expect(accumulator.title).toBe('Old doc');
    expect(accumulator.lines).toEqual([{ lineId: 'l1', text: 'still v1' }]);
    expect('archived' in accumulator).toBe(false);

    // The read side migrates: latest-shaped even with nothing pending.
    const view = workspace.docs.noteA.view(state);
    expect(view.schemaVersion).toBe(2);
    expect(view.archived).toBe(false);
    expect(view.title).toBe('Old doc');
  });

  it('reset reseeds the initial history views', () => {
    const workspace = createTestWorkspace();

    function* story(): AskResponse<void> {
      yield* askUIEventDocWorkspaceSetHistoryEvents('noteA', [initStateEvent(0), serverEvent(NoteEvent.SetTitle, { title: 'gone' }, 1)]);
      yield* askUIEventDocWorkspaceReset();
    }

    const state = runWorkspaceStory(workspace, story);

    expect(state.history.noteA).toHaveLength(0);
    expect(state.historyViews.noteA).toEqual(createInitialNoteState());
  });
});

// ─── Selectors ───────────────────────────────────────────────────────────────────────

describe('createEventDocWorkspace selectors', () => {
  it('folds the live view from saved + pending and memoizes on stream identity', () => {
    const workspace = createTestWorkspace();

    function* story(): AskResponse<void> {
      yield* askUIEventDocWorkspaceSetHistoryEvents('noteA', [initStateEvent()]);
      yield* workspace.docs.noteA.api.askNoteSetTitle('Live title');
      yield* workspace.docs.noteA.api.askNoteAddLine('l1', 'a line');
    }

    const state = runWorkspaceStory(workspace, story);

    const view = workspace.docs.noteA.view(state);
    expect(view.id).toBe('doc-1'); // from the saved INIT_STATE
    expect(view.title).toBe('Live title'); // from pending
    expect(view.lines).toEqual([{ lineId: 'l1', text: 'a line' }]);
    expect(view.status).toBe(EventDocStatus.Draft);

    // Same streams = the exact same folded object, not a refold.
    expect(workspace.docs.noteA.view(state)).toBe(view);

    expect(workspace.docs.noteA.liveEvents(state)).toHaveLength(3);
    expect(workspace.selectors.isDirty(state)).toBe(true);
    expect(workspace.docs.noteB.view(state).id).toBe(''); // untouched slot folds to its initial
  });

  it('isDirty goes false once pending is drained by a save', () => {
    const fake = createFakeTransport([initStateEvent()]);
    const workspace = createTestWorkspace(fake.transport);

    function* story(): AskResponse<void> {
      yield* workspace.api.askInit({ noteA: identityA });
      yield* workspace.docs.noteA.api.askNoteSetTitle('to save');
      yield* workspace.api.askSave();
    }

    const state = runWorkspaceStory(workspace, story);

    expect(workspace.selectors.isDirty(state)).toBe(false);
    expect(workspace.docs.noteA.view(state).title).toBe('to save');
    expect(workspace.selectors.error(state)).toBeNull();
  });

  it('view is the stored history view plus the pending fold', () => {
    const workspace = createTestWorkspace();

    function* story(): AskResponse<void> {
      yield* askUIEventDocWorkspaceSetHistoryEvents('noteA', [initStateEvent()]);
      yield* workspace.docs.noteA.api.askNoteSetTitle('unsaved title');
    }

    const state = runWorkspaceStory(workspace, story);

    // The stored base holds only saved truth; the live view layers pending on top.
    expect((state.historyViews.noteA as NoteState).title).toBe('');
    expect(workspace.docs.noteA.view(state).title).toBe('unsaved title');
    expect(workspace.docs.noteA.view(state).id).toBe('doc-1');
  });

  it('isDirty counts document pending only: a chrome toggle does not dirty', () => {
    const workspace = createTestWorkspace();

    function* chromeOnlyStory(): AskResponse<void> {
      yield* workspace.docs.chrome.api.askChromeSetHelpOpen(true);
    }

    const chromeOnlyState = runWorkspaceStory(workspace, chromeOnlyStory);
    expect(chromeOnlyState.pending.chrome).toHaveLength(1);
    expect(workspace.selectors.isDirty(chromeOnlyState)).toBe(false);

    function* documentEditStory(): AskResponse<void> {
      yield* workspace.docs.chrome.api.askChromeSetHelpOpen(true);
      yield* workspace.docs.noteA.api.askNoteSetTitle('unsaved');
    }

    const documentEditState = runWorkspaceStory(workspace, documentEditStory);
    expect(workspace.selectors.isDirty(documentEditState)).toBe(true);
  });

  it('a mixed-version pending tail folds: old-version events, migrate at the boundary, new-version events', () => {
    // The federated hot-swap shape: pending authored at v1 survives a module upgrade,
    // and events committed after the swap follow at v2. The tail is monotonically
    // non-decreasing by design (the same rule the backend append enforces).
    const workspace = createEventDocWorkspace({ slots: { noteA: createNoteV2Slot() } });

    function* story(): AskResponse<void> {
      yield* askUIEventDocWorkspaceSetHistoryEvents('noteA', [initStateEvent()]);
      yield* askUIEventDocWorkspaceSetPendingEvents('noteA', [
        serverEvent(NoteEvent.AddLine, { lineId: 'l1', text: 'authored at v1' }, 1),
        eventAtVersion(serverEvent(NoteEvent.SetTitle, { title: 'authored at v2' }, 2), 2),
      ]);
    }

    const state = runWorkspaceStory(workspace, story);

    const view = workspace.docs.noteA.view(state);
    expect(view.schemaVersion).toBe(2);
    expect(view.archived).toBe(false);
    expect(view.lines).toEqual([{ lineId: 'l1', text: 'authored at v1' }]);
    expect(view.title).toBe('authored at v2');
  });

  it('a pending event below the already-folded version throws at view read', () => {
    // The stale-client guard the monotonic relaxation keeps: once the folded doc is
    // at v2, a v1 pending event can only be a corrupt buffer.
    const workspace = createEventDocWorkspace({ slots: { noteA: createNoteV2Slot() } });

    function* story(): AskResponse<void> {
      yield* askUIEventDocWorkspaceSetHistoryEvents('noteA', [
        initStateEvent(0),
        eventAtVersion(serverEvent(NoteEvent.SetTitle, { title: 'already v2' }, 1), 2),
      ]);
      yield* askUIEventDocWorkspaceSetPendingEvents('noteA', [serverEvent(NoteEvent.AddLine, { lineId: 'l1', text: 'stale v1' }, 2)]);
    }

    const state = runWorkspaceStory(workspace, story);

    expect(() => workspace.docs.noteA.view(state)).toThrow(/non-decreasing/);
  });

  it('an old-version pending tail on a PRISTINE base folds without throwing (snapshot restore mid-load)', () => {
    // During a snapshot-restore init the buffer is seeded before the history fetch
    // lands: the base is the slot's pristine seed, which carries the latest version
    // as a default with no events behind it. That must not reject the restored tail.
    const workspace = createEventDocWorkspace({ slots: { noteA: createNoteV2Slot() } });

    function* story(): AskResponse<void> {
      yield* askUIEventDocWorkspaceSetPendingEvents('noteA', [serverEvent(NoteEvent.SetTitle, { title: 'restored v1' }, 0)]);
    }

    const state = runWorkspaceStory(workspace, story);

    expect(() => workspace.docs.noteA.view(state)).not.toThrow();
    expect(workspace.docs.noteA.view(state).title).toBe('restored v1');
  });
});

// ─── Transient streams: events that were never meant to survive ─────────────────────

describe('createEventDocWorkspace transient streams', () => {
  it('routes transient applies via the bind into the right slot AND key, stamped, unvalidated', () => {
    const workspace = createTestWorkspace();

    function* story(): AskResponse<void> {
      yield* workspace.docs.noteA.api.askNoteTransientSetTitle('conn-1', 'a1');
      yield* workspace.docs.noteA.api.askNoteTransientAddLine('conn-2', 'l1', 'from conn-2');
      yield* workspace.docs.noteB.api.askNoteTransientSetTitle('conn-1', 'b1');
    }

    const state = runWorkspaceStory(workspace, story);

    expect(Object.keys(state.transient.noteA).sort()).toEqual(['conn-1', 'conn-2']);
    expect(state.transient.noteA['conn-1']).toHaveLength(1);
    expect(state.transient.noteA['conn-1'][0].payload.data).toEqual({ title: 'a1' });
    expect(state.transient.noteA['conn-2'][0].payload.data).toEqual({ lineId: 'l1', text: 'from conn-2' });
    expect(state.transient.noteB['conn-1'][0].payload.data).toEqual({ title: 'b1' });

    // Same guid/date/schemaVersion stamping as the ordinary commit. Transient events hold
    // no log position (they never save) — ordering is by createdAt at read time.
    expect(state.transient.noteA['conn-1'][0].payload.metadata).toEqual({
      version: 1,
      clientMessageId: 'guid-1',
      createdBy: { userId: '', userDisplayName: '' },
      createdAt: constantNow,
      eventId: 0,
    });

    // Nothing leaks into the persistable groups.
    expect(state.pending.noteA).toHaveLength(0);
    expect(state.pending.noteB).toHaveLength(0);
    expect(state.history.noteA).toHaveLength(0);
  });

  it('skips validation: a published document still accepts transient events', () => {
    const workspace = createTestWorkspace();

    function* story(): AskResponse<void> {
      yield* askUIEventDocWorkspaceSetHistoryEvents('noteA', [initStateEvent(0), publishEvent(1)]);
      yield* workspace.docs.noteA.api.askNoteTransientSetTitle('conn-1', 'observation, not an edit');
    }

    const state = runWorkspaceStory(workspace, story);

    expect(state.transient.noteA['conn-1']).toHaveLength(1);
    expect(state.slots.noteA.error).toBeNull();
  });

  it('folds base + pending + transient, transient ordered by createdAt across keys', () => {
    const workspace = createTestWorkspace();

    function* story(): AskResponse<void> {
      yield* askUIEventDocWorkspaceSetHistoryEvents('noteA', [initStateEvent()]);
      yield* workspace.docs.noteA.api.askNoteAddLine('l1', 'pending line');
      yield* workspace.docs.noteA.api.askNoteTransientAddLine('conn-b', 'l2', 'late');
      yield* workspace.docs.noteA.api.askNoteTransientAddLine('conn-a', 'l3', 'early');
    }

    const state = runWorkspaceStory(workspace, story, [
      '2026-07-16T00:00:00.000Z', // the pending commit
      '2026-07-16T00:00:03.000Z', // conn-b's transient: committed FIRST, stamped LATER
      '2026-07-16T00:00:01.000Z', // conn-a's transient: committed second, stamped earlier
    ]);

    // The merge is time-ordered, not commit-ordered.
    const transientLineIds = getSlotTransientEvents(state, 'noteA').map((event) => (event.payload.data as NoteLine).lineId);
    expect(transientLineIds).toEqual(['l3', 'l2']);

    // Block order in the fold: pending before every transient; then time within transient.
    const view = workspace.docs.noteA.view(state);
    expect(view.lines).toEqual([
      { lineId: 'l1', text: 'pending line' },
      { lineId: 'l3', text: 'early' },
      { lineId: 'l2', text: 'late' },
    ]);
  });

  it('breaks createdAt ties by transientKey then position for determinism', () => {
    const workspace = createTestWorkspace();

    function* story(): AskResponse<void> {
      yield* workspace.docs.noteA.api.askNoteTransientAddLine('zz', 'l1', 'zz first');
      yield* workspace.docs.noteA.api.askNoteTransientAddLine('aa', 'l2', 'aa first');
      yield* workspace.docs.noteA.api.askNoteTransientAddLine('zz', 'l3', 'zz second');
    }

    // The constant date mock stamps every event identically, so ONLY the tie-break
    // orders the merge: 'aa' before 'zz', positions within a key preserved.
    const state = runWorkspaceStory(workspace, story);

    expect(getSlotTransientEvents(state, 'noteA').map((event) => (event.payload.data as NoteLine).lineId)).toEqual(['l2', 'l1', 'l3']);
  });

  it('coalesces within a transientKey with the slot rules, never across keys', () => {
    const workspace = createTestWorkspace();

    function* story(): AskResponse<void> {
      yield* workspace.docs.noteA.api.askNoteTransientSetTitle('conn-1', 'one');
      yield* workspace.docs.noteA.api.askNoteTransientSetTitle('conn-1', 'two');
      yield* workspace.docs.noteA.api.askNoteTransientSetTitle('conn-1', 'three');
      yield* workspace.docs.noteA.api.askNoteTransientSetTitle('conn-2', 'other');
    }

    const state = runWorkspaceStory(workspace, story);

    // The one-per-type SetTitle rule collapses conn-1's burst to its latest ...
    expect(state.transient.noteA['conn-1']).toHaveLength(1);
    expect(state.transient.noteA['conn-1'][0].payload.data).toEqual({ title: 'three' });
    // ... without reaching into conn-2's group.
    expect(state.transient.noteA['conn-2']).toHaveLength(1);
    expect(state.transient.noteA['conn-2'][0].payload.data).toEqual({ title: 'other' });
  });

  it('drop clears the key across ALL slots and the folded view reverts', () => {
    const workspace = createTestWorkspace();

    function* commits(): AskResponse<void> {
      yield* workspace.docs.noteA.api.askNoteSetTitle('pending title');
      yield* workspace.docs.noteA.api.askNoteTransientSetTitle('conn-1', 'transient title');
      yield* workspace.docs.noteB.api.askNoteTransientAddLine('conn-1', 'l1', 'b line');
      yield* workspace.docs.noteA.api.askNoteTransientAddLine('conn-2', 'l9', 'other connection');
    }

    const before = runWorkspaceStory(workspace, () => commits());
    expect(workspace.docs.noteA.view(before).title).toBe('transient title');
    expect(workspace.docs.noteB.view(before).lines).toEqual([{ lineId: 'l1', text: 'b line' }]);

    function* dropStory(): AskResponse<void> {
      yield* commits();
      yield* askUIEventDocWorkspaceDropTransient('conn-1');
    }

    const after = runWorkspaceStory(workspace, dropStory);

    // conn-1 is gone from EVERY slot; conn-2 and the pending buffer are untouched.
    expect(after.transient.noteA['conn-1']).toBeUndefined();
    expect(after.transient.noteB).toEqual({});
    expect(after.transient.noteA['conn-2']).toHaveLength(1);
    expect(workspace.docs.noteA.view(after).title).toBe('pending title');
    expect(workspace.docs.noteA.view(after).lines).toEqual([{ lineId: 'l9', text: 'other connection' }]);
    expect(workspace.docs.noteB.view(after).lines).toEqual([]);
  });

  it('reset clears all transient groups', () => {
    const workspace = createTestWorkspace();

    function* story(): AskResponse<void> {
      yield* workspace.docs.noteA.api.askNoteTransientSetTitle('conn-1', 'gone');
      yield* askUIEventDocWorkspaceReset();
    }

    const state = runWorkspaceStory(workspace, story);

    expect(state.transient.noteA).toEqual({});
    expect(workspace.docs.noteA.view(state).title).toBe('');
  });

  it('save, cancel and isDirty ignore transient entirely', () => {
    const fake = createFakeTransport([initStateEvent()]);
    const workspace = createTestWorkspace(fake.transport);

    function* story(): AskResponse<void> {
      yield* workspace.api.askInit({ noteA: identityA });
      yield* workspace.docs.noteA.api.askNoteTransientSetTitle('conn-1', 'never saved');
      yield* workspace.docs.noteA.api.askNoteAddLine('l1', 'saved line');
      yield* workspace.api.askSave();
      yield* workspace.docs.noteA.api.askNoteTransientAddLine('conn-1', 'l2', 'post-save transient');
      yield* workspace.api.askCancel();
    }

    const state = runWorkspaceStory(workspace, story);

    // Save streamed only the pending line; nothing transient touched the wire.
    expect(fake.appended).toHaveLength(1);
    expect(fake.appended[0].payload.data).toEqual({ lineId: 'l1', text: 'saved line' });
    // Cancel drained nothing transient either: both of conn-1's events survive.
    expect(state.transient.noteA['conn-1']).toHaveLength(2);
    // Pending is drained and only transient remains: the workspace is not dirty.
    expect(workspace.selectors.isDirty(state)).toBe(false);
    expect(state.pending.noteA).toHaveLength(0);
  });

  it('fails loudly when a transient verb runs outside any workspace bind', () => {
    const workspace = createTestWorkspace();

    function* story(): AskResponse<void> {
      yield* askNoteTransientSetTitle('conn-1', 'nowhere to go');
    }

    expect(() => runWorkspaceStory(workspace, story)).toThrow(/ApplyTransientEvent/);
  });

  it('keeps the persistable log transient-free: getSlotLiveEvents and liveEvents', () => {
    const workspace = createTestWorkspace();

    function* story(): AskResponse<void> {
      yield* askUIEventDocWorkspaceSetHistoryEvents('noteA', [initStateEvent()]);
      yield* workspace.docs.noteA.api.askNoteSetTitle('pending');
      yield* workspace.docs.noteA.api.askNoteTransientSetTitle('conn-1', 'transient');
    }

    const state = runWorkspaceStory(workspace, story);

    expect(getSlotLiveEvents(state, 'noteA')).toHaveLength(2); // history + pending only
    expect(workspace.docs.noteA.liveEvents(state)).toHaveLength(2);
    expect(getSlotTransientEvents(state, 'noteA')).toHaveLength(1);
  });

  it('a transient event below the already-folded version throws at view read', () => {
    const workspace = createEventDocWorkspace({ slots: { noteA: createNoteV2Slot() } });

    // Committed via the state effect directly to forge a stale version — the bind
    // always stamps the slot's own schemaVersion, so this can't happen through it.
    // The transient tail reuses the pending fold, so it inherits the same
    // monotonic guard: once the folded doc is at v2, a v1 transient is corrupt.
    function* story(): AskResponse<void> {
      yield* askUIEventDocWorkspaceSetHistoryEvents('noteA', [
        initStateEvent(0),
        eventAtVersion(serverEvent(NoteEvent.SetTitle, { title: 'already v2' }, 1), 2),
      ]);
      yield* askUIEventDocWorkspaceApplyTransientEvent('noteA', 'conn-1', serverEvent(NoteEvent.SetTitle, { title: 'stale v1' }, 2));
    }

    const state = runWorkspaceStory(workspace, story);

    expect(() => workspace.docs.noteA.view(state)).toThrow(/non-decreasing/);
  });
});

describe('createEventDocWorkspace history validation', () => {
  // The editor's live view folds history through the workspace's own incremental path, not
  // through definition.fold. Without the slot's validators reaching it, the editor showed
  // events that every other reader rejects — an edit made after publish appeared to stick.
  it('ignores a history event that lands after PUBLISH', () => {
    const workspace = createTestWorkspace();

    function* story(): AskResponse<void> {
      yield* askUIEventDocWorkspaceSetHistoryEvents('noteA', [
        initStateEvent(0),
        serverEvent(NoteEvent.SetTitle, { title: 'Before publish' }, 1),
        publishEvent(2),
        serverEvent(NoteEvent.SetTitle, { title: 'After publish' }, 3),
      ]);
    }

    const state = runWorkspaceStory(workspace, story);

    expect(workspace.docs.noteA.view(state).title).toBe('Before publish');
  });

  it('still folds the log-opening INIT, so identity survives', () => {
    // The other half of the same regression: a guard that refused every INIT left the folded
    // document holding placeholder identity.
    const workspace = createTestWorkspace();

    function* story(): AskResponse<void> {
      yield* askUIEventDocWorkspaceSetHistoryEvents('noteA', [initStateEvent(0)]);
    }

    const state = runWorkspaceStory(workspace, story);

    expect(workspace.docs.noteA.view(state).id).toBe('doc-1');
  });
});
