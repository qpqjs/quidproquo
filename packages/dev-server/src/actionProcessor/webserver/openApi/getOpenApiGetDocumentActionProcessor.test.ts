import { createStreamRegistry } from '@qpqjs/core';
import { buildActionProcessorList, buildTestQpqConfig, buildTestStorySession, createStubLogger, noopDynamicModuleLoader } from '@qpqjs/testing';
import { defineApi, defineDns, defineRoute, OpenApiActionType, OpenApiDocument } from '@qpqjs/webserver';

import { describe, expect, it } from 'vitest';

import { getOpenApiGetDocumentActionProcessor } from './getOpenApiGetDocumentActionProcessor';

describe('dev server getOpenApiGetDocumentActionProcessor', () => {
  it('points servers at the dev mount path instead of the api subdomain', async () => {
    const qpqConfig = buildTestQpqConfig([
      defineDns('localhost:8080'),
      defineApi('api'),
      defineApi('old', { deprecated: true }),
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
