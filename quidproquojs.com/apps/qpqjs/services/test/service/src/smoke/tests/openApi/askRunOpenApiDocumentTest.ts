import { askOpenApiGetDocument, AskResponse } from 'quidproquo';

import { askSmokeAssert } from '../askSmokeAssert';

// The generated document, built in-process from the deployed config. Proves the
// openApi processor is registered on this runtime and that the route schemas
// survived the trip from config into the bundle. No network involved.
export function* askRunOpenApiDocumentTest(): AskResponse<void> {
  const document = yield* askOpenApiGetDocument();

  const echo = document.paths['/v1/echo/{pathValue}']?.post;
  yield* askSmokeAssert(!!echo, 'echo route is missing from the document');
  yield* askSmokeAssert(
    !!echo?.requestBody?.content['application/json'].schema.properties,
    'echo route has no request body schema'
  );
  yield* askSmokeAssert(
    echo?.parameters?.some((p) => p.in === 'path' && p.name === 'pathValue') ===
      true,
    'echo route has no pathValue path parameter'
  );
  yield* askSmokeAssert(
    !!echo?.responses['422'],
    'echo route does not document its 422'
  );

  const smokeRun = document.paths['/smoke/run/{runId}']?.get;
  yield* askSmokeAssert(
    !!smokeRun?.responses['200'].content?.['application/json'].schema,
    'smoke run route has no response schema'
  );

  yield* askSmokeAssert(
    !document.paths['/v1/docs'] && !document.paths['/v1/docs/openapi.json'],
    'docs routes should be hidden from the document'
  );

  yield* askSmokeAssert(
    document.servers.length > 0,
    'document lists no servers'
  );
}
