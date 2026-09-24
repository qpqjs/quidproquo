import { SmokeSuite } from '../../harness/types/SmokeSuite';
import { defineOpenApiSmoke } from './config/defineOpenApiSmoke';
import { askRunEchoRoundTripTest } from './logic/askRunEchoRoundTripTest';
import { askRunOpenApiDocumentTest } from './logic/askRunOpenApiDocumentTest';

/** The generated OpenAPI document, and the echo route called through its servers entry. */
export const openApiSmokeSuite: SmokeSuite = {
  defineConfig: defineOpenApiSmoke,
  tests: [
    { name: 'openApiDocument', askRun: askRunOpenApiDocumentTest },
    { name: 'echoRoundTrip', askRun: askRunEchoRoundTripTest },
  ],
};
