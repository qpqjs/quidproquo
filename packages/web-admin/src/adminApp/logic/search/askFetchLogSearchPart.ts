import { askCatch, AskResponse, EitherActionResult, HTTPNetworkResponse, StoryResultMetadata } from 'quidproquo-core';
import { QpqLogList } from 'quidproquo-webserver';

import { askPlatformRequest } from '../../../platformLogic/network/askPlatformRequest';
import { askUIVolatileLogSearchPartLoaded } from '../../actionCreators/volatile/askUIVolatileLogSearchPartLoaded';
import { AdminSearchParams } from '../../types/AdminSearchParams';

// One search part = the full page-loop for one runtime type. Each part lands
// in the volatile cache as it completes so the grid fills progressively.
export function* askFetchLogSearchPart(
  searchKey: string,
  search: AdminSearchParams,
  runtimeType: string,
  nowIso: string,
  onlyErrors: boolean,
): AskResponse<void> {
  let logs: StoryResultMetadata[] = [];
  let nextPageKey: string | undefined = undefined;

  do {
    const response: EitherActionResult<HTTPNetworkResponse<QpqLogList>> = yield* askCatch(
      askPlatformRequest<unknown, QpqLogList>('POST', '/log/list', {
        body: {
          runtimeType,
          startIsoDateTime: search.startIsoDateTime || nowIso,
          endIsoDateTime: search.endIsoDateTime || nowIso,
          serviceFilter: search.service,
          infoFilter: search.info,
          errorFilter: search.error,
          userFilter: search.user,
          deep: search.deep,
          onlyErrors,
          nextPageKey,
        },
      }),
    );

    if (!response.success || response.result.status < 200 || response.result.status >= 300) {
      break;
    }

    logs = [...logs, ...response.result.data.items];
    nextPageKey = response.result.data.nextPageKey;
  } while (nextPageKey);

  yield* askUIVolatileLogSearchPartLoaded(searchKey, logs);
}
