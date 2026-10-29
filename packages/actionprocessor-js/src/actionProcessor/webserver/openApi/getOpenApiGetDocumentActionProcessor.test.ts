import { createStreamRegistry } from '@qpqjs/core';
import { buildActionProcessorList, buildTestQpqConfig, buildTestStorySession, createStubLogger, noopDynamicModuleLoader } from '@qpqjs/testing';
import { defineRoute, OpenApiActionType, OpenApiDocument } from '@qpqjs/webserver';

import { describe, expect, it } from 'vitest';

import { getOpenApiGetDocumentActionProcessor } from './getOpenApiGetDocumentActionProcessor';

describe('getOpenApiGetDocumentActionProcessor', () => {
  it('builds the document from the config it was created with', async () => {
    const qpqConfig = buildTestQpqConfig([defineRoute('GET', '/v1/widgets', '/src/widgets::list')]);
    const processors = await getOpenApiGetDocumentActionProcessor(qpqConfig, noopDynamicModuleLoader);

    const [document] = await processors![OpenApiActionType.GetDocument]!(
      { options: { title: 'Widgets' } },
      buildTestStorySession(),
      buildActionProcessorList({}),
      createStubLogger(),
      () => {},
      noopDynamicModuleLoader,
      createStreamRegistry(),
    );

    expect((document as OpenApiDocument).info.title).toBe('Widgets');
    expect(Object.keys((document as OpenApiDocument).paths)).toEqual(['/v1/widgets']);
  });
});
