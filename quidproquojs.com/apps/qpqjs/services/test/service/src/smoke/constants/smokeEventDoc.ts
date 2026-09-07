import { EventDocEventActor, EventDocStoreOptions } from 'quidproquo-features';

// The throwaway event-doc collection the smoke tests write to, registered in full via
// defineEventDoc (see ../eventDoc/smokeProbeDocDefinition): stores, stream projector,
// dynamic functions and routes, exactly as a real service's collection.
export const SMOKE_EVENT_DOC_STORE = 'smokeEventDocs';
export const SMOKE_EVENT_DOC_TYPE = 'smokeProbeDoc';
export const SMOKE_EVENT_DOC_BASE_PATH = '/smoke/probe-docs' as const;

export const SMOKE_EVENT_DOC_STORE_OPTIONS: EventDocStoreOptions = {
  storeName: SMOKE_EVENT_DOC_STORE,
  type: SMOKE_EVENT_DOC_TYPE,
};

// The queue the tests fan their writers out on: one message per writer, each landing in
// its own invocation, so the appends race across lambdas rather than inside one.
export const SMOKE_EVENT_DOC_APPEND_QUEUE = 'smokeEventDocAppends';
export const SMOKE_EVENT_DOC_APPEND_MESSAGE_TYPE = 'smokeEventDocAppend';

// The one event type the probe docs ever carry; its data is a SmokeEventDocMark.
export const SMOKE_EVENT_DOC_MARK_EVENT = 'SMOKE_MARK';
export const SMOKE_EVENT_DOC_SCHEMA_VERSION = 1;

export const SMOKE_EVENT_DOC_ACTOR: EventDocEventActor = {
  userId: 'smoke',
  userDisplayName: 'Smoke run',
};
