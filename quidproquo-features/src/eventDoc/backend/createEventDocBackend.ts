import { AskResponse, Nullable } from 'quidproquo-core';

import { askEventDocProvideStore } from '../context/askEventDocProvideStore';
import { askEventDocCopyAsset } from '../data/askEventDocCopyAsset';
import { askEventDocEventListAll } from '../data/askEventDocEventListAll';
import { askEventDocGenerateAssetDownloadUrl } from '../data/askEventDocGenerateAssetDownloadUrl';
import { askEventDocGenerateAssetUploadUrl } from '../data/askEventDocGenerateAssetUploadUrl';
import { askEventDocList } from '../data/askEventDocList';
import { getEventDocFunctionsIdentity } from '../definition/getEventDocFunctionsIdentity';
import { EventDocView } from '../definition/types/EventDocDefinition';
import { EventDocFunctions } from '../definition/types/EventDocFunctions';
import { EVENT_DOC_PRIMARY_VIEW } from '../definition/types/EventDocLatestViews';
import { askEventDocAppendServerEvent } from '../logic/askEventDocAppendServerEvent';
import { askEventDocCreate } from '../logic/askEventDocCreate';
import { askEventDocDocumentStateAsOfTime } from '../logic/askEventDocDocumentStateAsOfTime';
import { askEventDocDocumentStateLatest } from '../logic/askEventDocDocumentStateLatest';
import { askEventDocGetByCodeOrCreate } from '../logic/askEventDocGetByCodeOrCreate';
import { askEventDocGetByIdOrThrow } from '../logic/askEventDocGetByIdOrThrow';
import { askEventDocGetIdByCode } from '../logic/askEventDocGetIdByCode';
import { askEventDocPublishedVersionAsOf } from '../logic/askEventDocPublishedVersionAsOf';
import { EventDocDocumentStateAtEvent, EventDocVersionState } from '../models';
import { EventDocBackend } from './EventDocBackend';

/** A functions surface that also carries a typed `document` view — what a definition is; how the state type is inferred. */
type EventDocFunctionsWithDocumentView<TState> = EventDocFunctions & {
  views: Record<typeof EVENT_DOC_PRIMARY_VIEW, EventDocView<TState>>;
};

/**
 * Bind the generic eventDoc verbs to one collection. Every verb provides its own store context
 * from the definition's identity before delegating. Service code only; the frontend never sees this.
 *
 * Pass the definition itself and the document reads come back typed as its folded `document` view; the erased
 * functions surface (an extended registration object) still works and reads `unknown`.
 */
export function createEventDocBackend<TState>(functions: EventDocFunctionsWithDocumentView<TState>): EventDocBackend<TState>;
export function createEventDocBackend(functions: EventDocFunctions): EventDocBackend;
export function createEventDocBackend<TState>(functions: EventDocFunctions): EventDocBackend<TState> {
  const identity = getEventDocFunctionsIdentity(functions);

  function* askProvideStore<T>(story: AskResponse<T>): AskResponse<T> {
    return yield* askEventDocProvideStore(identity, story);
  }

  return {
    *askGetByIdOrThrow(id) {
      return yield* askProvideStore(askEventDocGetByIdOrThrow(id));
    },
    *askGetIdByCode(code, ownerUserId) {
      return yield* askProvideStore(askEventDocGetIdByCode(code, ownerUserId));
    },
    *askGetByCodeOrCreate(code, name, actor, ownerUserId) {
      return yield* askProvideStore(askEventDocGetByCodeOrCreate(code, name, actor, ownerUserId));
    },
    *askList(options) {
      return yield* askProvideStore(askEventDocList(options));
    },
    *askCreate(name, code, actor) {
      return yield* askProvideStore(askEventDocCreate(name, code, actor));
    },
    *askEventListAll(modelId, options) {
      return yield* askProvideStore(askEventDocEventListAll(modelId, options));
    },
    // The log stories fold to `unknown`; the definition's `document` view is what they fold WITH, so these three are
    // the one place the state is named as that view's type — every caller reads it typed from here.
    *askDocumentStateLatest(id) {
      return (yield* askProvideStore(askEventDocDocumentStateLatest(id))) as Nullable<EventDocDocumentStateAtEvent<TState>>;
    },
    *askDocumentStateAsOfTime(id, clock) {
      return (yield* askProvideStore(askEventDocDocumentStateAsOfTime(id, clock))) as Nullable<EventDocDocumentStateAtEvent<TState>>;
    },
    *askPublishedVersionAsOf(id, clock) {
      return (yield* askProvideStore(askEventDocPublishedVersionAsOf(id, clock))) as Nullable<EventDocVersionState<TState>>;
    },
    *askAppendServerEvent(modelId, type, data, version, actor) {
      return yield* askProvideStore(askEventDocAppendServerEvent(modelId, type, data, version, actor));
    },
    *askGenerateAssetUploadUrl(docId, contentType, contentDisposition) {
      return yield* askProvideStore(askEventDocGenerateAssetUploadUrl(docId, contentType, contentDisposition));
    },
    *askGenerateAssetDownloadUrl(docId, assetId) {
      return yield* askProvideStore(askEventDocGenerateAssetDownloadUrl(docId, assetId));
    },
    *askCopyAssetFrom(sourceStoreName, sourceDocId, sourceAsset, targetDocId, targetFilename) {
      return yield* askProvideStore(askEventDocCopyAsset(sourceStoreName, sourceDocId, sourceAsset, targetDocId, targetFilename));
    },
    askProvideStore,
  };
}
