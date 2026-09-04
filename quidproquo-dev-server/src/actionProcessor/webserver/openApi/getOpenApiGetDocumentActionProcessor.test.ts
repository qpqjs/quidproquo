import {
  buildActionProcessorList,
  buildTestQpqConfig,
  buildTestStorySession,
  createStreamRegistry,
  createStubLogger,
  noopDynamicModuleLoader,
} from 'quidproquo-core';
import { defineApi, defineDns, defineRoute, OpenApiActionType, OpenApiDocument } from 'quidproquo-webserver';

import { describe, expect, it } from 'vitest';

import { getOpenApiGetDocumentActionProcessor } from './getOpenApiGetDocumentActionProcessor';

describe('dev server getOpenApiGetDocumentActionProcessor', () => {
  it('points servers at the dev mount path instead of the api subdomain', async () => {
    const qpqConfig = buildTestQpqConfig([
      defineDns('localhost:8080'),
      defineApi('api', 'localhost:8080'),
      defineApi('old', 'localhost:8080', { deprecated: true }),
      defineRoute('GET', '/v1/widgets', '/src/widgets::list'),
    ]);
    const processors = await getOpenApiGetDocumentActionProcessor(qpqConfig, noopDynamicModuleLoader);

    const [document] = await processors[OpenApiActionType.GetDocument](
      { options: {} },
      buildTestStorySession(),
      buildActionProcessorList({}),
      createStubLogger(),
      () => {},
      noopDynamicModuleLoader,
      createStreamRegistry(),
    );

    expect((document as OpenApiDocument).servers).toEqual([{ url: 'http://localhost:8080/api/test-module' }]);
    expect(Object.keys((document as OpenApiDocument).paths)).toEqual(['/v1/widgets']);
  });
});
