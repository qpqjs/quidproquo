import { AskResponse } from '@qpqjs/core';
import { HTTPEvent, HTTPEventResponse, qpqWebServerUtils } from '@qpqjs/webserver';

import { eventDocRouteAction } from '../../constants/eventDocRouteAction';
import { EVENT_DOC_SUMMARY_VIEW } from '../../definition/types/EventDocLatestViews';
import { askEventDocProvideRequestScope } from '../../globals/askEventDocProvideRequestScope';
import { askEventDocProvideStoreFromGlobals } from '../../globals/askEventDocProvideStoreFromGlobals';
import { askEventDocListViewPageLatest } from '../../logic/askEventDocListViewPageLatest';

function* askEventDocStoreList(event: HTTPEvent): AskResponse<HTTPEventResponse> {
  const limit = qpqWebServerUtils.readUriQueryParamFromEvent(event, 'limit');
  const nextPageKey = qpqWebServerUtils.readUriQueryParamFromEvent(event, 'nextPageKey');
  const view = qpqWebServerUtils.readUriQueryParamFromEvent(event, 'view');

  const page = yield* askEventDocListViewPageLatest(view || EVENT_DOC_SUMMARY_VIEW, {
    limit: limit ? Number(limit) : undefined,
    nextPageKey: nextPageKey || undefined,
  });

  return qpqWebServerUtils.toJsonEventResponse(page);
}

/**
 * GET {basePath}: one page of a list view as QpqPagedData (newest first, excludes soft-deleted). `view` names the list
 * view; without it the page holds summaries.
 */
export function* list(event: HTTPEvent): AskResponse<HTTPEventResponse> {
  return yield* askEventDocProvideStoreFromGlobals(askEventDocProvideRequestScope(event, askEventDocStoreList(event), eventDocRouteAction.list));
}
