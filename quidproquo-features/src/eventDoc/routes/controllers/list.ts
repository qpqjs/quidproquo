import { AskResponse } from 'quidproquo-core';
import { HTTPEvent, HTTPEventResponse, qpqWebServerUtils } from 'quidproquo-webserver';

import { askEventDocListPage } from '../../data/askEventDocListPage';
import { askEventDocProvideRequestScope } from '../../globals/askEventDocProvideRequestScope';
import { askEventDocProvideStoreFromGlobals } from '../../globals/askEventDocProvideStoreFromGlobals';

function* askEventDocStoreList(event: HTTPEvent): AskResponse<HTTPEventResponse> {
  const limit = qpqWebServerUtils.readUriQueryParamFromEvent(event, 'limit');
  const nextPageKey = qpqWebServerUtils.readUriQueryParamFromEvent(event, 'nextPageKey');

  const page = yield* askEventDocListPage({
    limit: limit ? Number(limit) : undefined,
    nextPageKey: nextPageKey || undefined,
  });

  return qpqWebServerUtils.toJsonEventResponse(page);
}

/** GET {basePath}: one page of summaries as QpqPagedData (newest first, excludes soft-deleted). */
export function* list(event: HTTPEvent): AskResponse<HTTPEventResponse> {
  return yield* askEventDocProvideStoreFromGlobals(askEventDocProvideRequestScope(event, askEventDocStoreList(event)));
}
