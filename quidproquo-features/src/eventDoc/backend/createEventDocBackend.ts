import { AskResponse } from 'quidproquo-core';

import { askEventDocProvideStore } from '../context/askEventDocProvideStore';
import { askEventDocEventListAll } from '../data/askEventDocEventListAll';
import { askEventDocGenerateAssetDownloadUrl } from '../data/askEventDocGenerateAssetDownloadUrl';
import { askEventDocGenerateAssetUploadUrl } from '../data/askEventDocGenerateAssetUploadUrl';
import { askEventDocList } from '../data/askEventDocList';
import { getEventDocFunctionsIdentity } from '../definition/getEventDocFunctionsIdentity';
import { EventDocFunctions } from '../definition/types/EventDocFunctions';
import { askEventDocAppendServerEvent } from '../logic/askEventDocAppendServerEvent';
import { askEventDocCreate } from '../logic/askEventDocCreate';
import { askEventDocDocumentStateAsOfTime } from '../logic/askEventDocDocumentStateAsOfTime';
import { askEventDocDocumentStateLatest } from '../logic/askEventDocDocumentStateLatest';
import { askEventDocGetByCodeOrCreate } from '../logic/askEventDocGetByCodeOrCreate';
import { askEventDocGetByIdOrThrow } from '../logic/askEventDocGetByIdOrThrow';
import { askEventDocGetIdByCode } from '../logic/askEventDocGetIdByCode';
import { askEventDocPublishedVersionAsOf } from '../logic/askEventDocPublishedVersionAsOf';
import { EventDocBackend } from './EventDocBackend';

/**
 * Bind the generic eventDoc verbs to one collection. Every verb provides its own store context
 * from the definition's identity before delegating. Service code only; the frontend never sees this.
 */
export const createEventDocBackend = (functions: EventDocFunctions): EventDocBackend => {
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
    *askDocumentStateLatest(id) {
      return yield* askProvideStore(askEventDocDocumentStateLatest(id));
    },
    *askDocumentStateAsOfTime(id, clock) {
      return yield* askProvideStore(askEventDocDocumentStateAsOfTime(id, clock));
    },
    *askPublishedVersionAsOf(id, clock) {
      return yield* askProvideStore(askEventDocPublishedVersionAsOf(id, clock));
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
    askProvideStore,
  };
};
