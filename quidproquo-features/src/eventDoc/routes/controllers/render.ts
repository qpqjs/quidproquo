import {
  askCatch,
  askDateNow,
  AskResponse,
  askThrowError,
  createDynamicFunctionCaller,
  ErrorTypeEnum,
  getValidQpqIsoDateTime,
  QpqIsoDateTime,
} from 'quidproquo-core';
import { HTTPEvent, HTTPEventResponse, qpqWebServerUtils } from 'quidproquo-webserver';

import { eventDocFunctionsName } from '../../constants/eventDocFunctionsName';
import { askEventDocResolveStore } from '../../context/askEventDocResolveStore';
import { EventDocInvokableFunctions } from '../../definition/types/EventDocInvokableFunctions';
import { askEventDocProvideRequestScope } from '../../globals/askEventDocProvideRequestScope';
import { askEventDocProvideStoreFromGlobals } from '../../globals/askEventDocProvideStoreFromGlobals';
import { askEventDocDocumentStateLatest } from '../../logic/askEventDocDocumentStateLatest';
import { askEventDocPublishedVersionAsOf } from '../../logic/askEventDocPublishedVersionAsOf';
import { isEventDocFunctionsMissing } from '../../logic/isEventDocFunctionsMissing';
import { EventDocRenderMode, EventDocVersion } from '../../models';

type ResolvedRender = {
  state: unknown;
  version?: EventDocVersion;
};

// Published with nothing effective is a 404, never a fallback to the draft. The version is returned alongside the
// state because the renderer needs `version.publishedAt` to resolve its own links.
function* askEventDocRenderResolve(
  modelId: string,
  renderMode: EventDocRenderMode | undefined,
  effectiveAt?: QpqIsoDateTime,
): AskResponse<ResolvedRender> {
  if (renderMode !== EventDocRenderMode.Published) {
    const stateAtHead = yield* askEventDocDocumentStateLatest(modelId);
    if (!stateAtHead) {
      return yield* askThrowError(ErrorTypeEnum.NotFound, `Document not found: ${modelId}`);
    }

    return { state: stateAtHead.state };
  }

  const clock = effectiveAt ?? ((yield* askDateNow()) as QpqIsoDateTime);
  const versionState = yield* askEventDocPublishedVersionAsOf(modelId, clock);
  if (!versionState) {
    return yield* askThrowError(ErrorTypeEnum.NotFound, `No published version is effective as of ${clock}.`);
  }

  return { state: versionState.state, version: versionState.version };
}

function* askEventDocStoreRender(event: HTTPEvent, modelId: string): AskResponse<HTTPEventResponse> {
  const { storeName, type } = yield* askEventDocResolveStore();

  const renderModeParam = qpqWebServerUtils.readUriQueryParamFromEvent(event, 'renderMode');
  const renderMode = renderModeParam === EventDocRenderMode.Draft || renderModeParam === EventDocRenderMode.Published ? renderModeParam : undefined;
  const effectiveAt = getValidQpqIsoDateTime(qpqWebServerUtils.readUriQueryParamFromEvent(event, 'effectiveAt'));

  // State resolution folds through the functions object too, so a collection with none fails here first.
  const resolved = yield* askCatch(askEventDocRenderResolve(modelId, renderMode, effectiveAt));

  if (!resolved.success) {
    if (isEventDocFunctionsMissing(resolved.error.errorType)) {
      return yield* askThrowError(ErrorTypeEnum.NotFound, 'This collection has no renderer configured.');
    }

    return yield* askThrowError(resolved.error.errorType, resolved.error.errorText);
  }

  const { state, version } = resolved.result;

  const functionsCaller = createDynamicFunctionCaller<EventDocInvokableFunctions>(eventDocFunctionsName(storeName, type));
  const rendered = yield* askCatch(
    functionsCaller.render({
      state,
      docId: modelId,
      version,
      renderMode,
      effectiveAt,
    }),
  );

  if (!rendered.success) {
    // A missing functions object or render member is a 404; any other error is a configured renderer failing.
    if (isEventDocFunctionsMissing(rendered.error.errorType)) {
      return yield* askThrowError(ErrorTypeEnum.NotFound, 'This collection has no renderer configured.');
    }

    return yield* askThrowError(rendered.error.errorType, rendered.error.errorText);
  }

  return qpqWebServerUtils.toJsonEventResponse(rendered.result);
}

/** GET {basePath}/{id}/render: renders the doc via the collection's `render` function; 404 when there is none. */
export function* render(event: HTTPEvent, params: { id: string }): AskResponse<HTTPEventResponse> {
  return yield* askEventDocProvideStoreFromGlobals(askEventDocProvideRequestScope(event, askEventDocStoreRender(event, params.id)));
}
