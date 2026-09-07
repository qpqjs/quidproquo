import { AskResponse, askThrowError, ErrorTypeEnum } from 'quidproquo-core';
import { HTTPEvent, HTTPEventResponse, qpqWebServerUtils } from 'quidproquo-webserver';

import { askEventDocProvideRequestScope } from '../../globals/askEventDocProvideRequestScope';
import { askEventDocProvideStoreFromGlobals } from '../../globals/askEventDocProvideStoreFromGlobals';
import { askEventDocResolveUserId } from '../../globals/askEventDocResolveUserId';
import { askEventDocSoftDelete } from '../../logic/askEventDocSoftDelete';

// A delete is an ordinary event under the fold's version-monotonicity rule, so schemaVersion cannot be defaulted:
// guessing 1 would produce an event the fold ignores on any doc already past v1.
function* askEventDocRemoveSchemaVersion(event: HTTPEvent): AskResponse<number> {
  const raw = qpqWebServerUtils.readUriQueryParamFromEvent(event, 'schemaVersion');
  const schemaVersion = Number(raw);

  if (!raw || !Number.isInteger(schemaVersion) || schemaVersion < 1) {
    return yield* askThrowError(ErrorTypeEnum.Invalid, 'schemaVersion is required and must be a positive integer');
  }

  return schemaVersion;
}

function* askEventDocStoreSoftDelete(event: HTTPEvent, id: string): AskResponse<HTTPEventResponse> {
  const userId = yield* askEventDocResolveUserId();
  const schemaVersion = yield* askEventDocRemoveSchemaVersion(event);

  const model = yield* askEventDocSoftDelete(id, userId, schemaVersion);
  return qpqWebServerUtils.toJsonEventResponse(model);
}

/** DELETE {basePath}/{id}?schemaVersion=N: soft-deletes the doc (`delete` is a reserved word, hence `remove`). */
export function* remove(event: HTTPEvent, params: { id: string }): AskResponse<HTTPEventResponse> {
  return yield* askEventDocProvideStoreFromGlobals(askEventDocProvideRequestScope(event, askEventDocStoreSoftDelete(event, params.id)));
}
