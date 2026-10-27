import { Effect } from 'quidproquo-core';

import { EventDocWorkspaceDocumentIdentity } from '../types/EventDocWorkspaceDocumentIdentity';
import { EventDocWorkspaceEffect } from './EventDocWorkspaceEffect';

/** Payload of the SetDocumentIdentity effect. */
export type EventDocWorkspaceSetDocumentIdentityPayload = {
  slotKey: string;
  documentIdentity: EventDocWorkspaceDocumentIdentity;
};

/** Binds a slot to a document. */
export type EventDocWorkspaceSetDocumentIdentityEffect = Effect<
  EventDocWorkspaceEffect.SetDocumentIdentity,
  EventDocWorkspaceSetDocumentIdentityPayload
>;
