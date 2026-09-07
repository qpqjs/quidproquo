import { AskResponse, Nullable, QpqIsoDateTime } from 'quidproquo-core';

import { askEventDocEventListAll } from '../data/askEventDocEventListAll';
import { askEventDocList } from '../data/askEventDocList';
import {
  EventDocAssetDownloadUrl,
  EventDocAssetUploadUrl,
  EventDocDocumentStateAtEvent,
  EventDocEvent,
  EventDocEventActor,
  EventDocSummary,
  EventDocVersionState,
} from '../models';

/**
 * A doc type's generic verbs bound to its collection: every call establishes the store context itself,
 * so callers never provide it by hand. Built by createEventDocBackend in service code only.
 */
export type EventDocBackend = {
  askGetByIdOrThrow: (id: string) => AskResponse<EventDocSummary>;
  askGetIdByCode: (code: string, ownerUserId?: string) => AskResponse<Nullable<string>>;
  askGetByCodeOrCreate: (code: string, name: string, actor: EventDocEventActor, ownerUserId?: string) => AskResponse<EventDocSummary>;
  askList: (options?: Parameters<typeof askEventDocList>[0]) => AskResponse<EventDocSummary[]>;
  askCreate: (name: string, code: string, actor: EventDocEventActor) => AskResponse<EventDocSummary>;
  askEventListAll: (modelId: string, options?: Parameters<typeof askEventDocEventListAll>[1]) => AskResponse<EventDocEvent[]>;
  askDocumentStateLatest: (id: string) => AskResponse<Nullable<EventDocDocumentStateAtEvent>>;
  askDocumentStateAsOfTime: (id: string, clock: QpqIsoDateTime) => AskResponse<Nullable<EventDocDocumentStateAtEvent>>;
  askPublishedVersionAsOf: (id: string, clock: QpqIsoDateTime) => AskResponse<Nullable<EventDocVersionState>>;
  askAppendServerEvent: <T>(modelId: string, type: string, data: T, version: number, actor: EventDocEventActor) => AskResponse<EventDocEvent>;
  askGenerateAssetUploadUrl: (docId: string, contentType: string, contentDisposition?: string) => AskResponse<EventDocAssetUploadUrl>;
  askGenerateAssetDownloadUrl: (docId: string, assetId: string) => AskResponse<EventDocAssetDownloadUrl>;

  // Runs any story under this collection's store context.
  askProvideStore: <T>(story: AskResponse<T>) => AskResponse<T>;
};
