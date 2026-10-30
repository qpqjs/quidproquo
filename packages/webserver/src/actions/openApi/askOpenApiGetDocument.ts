import { createActionRequester } from '@qpqjs/core';

import { OpenApiDocument } from '../../types/OpenApiDocument';
import { OpenApiDocumentOptions } from '../../utils/openApi/OpenApiDocumentOptions';
import { OpenApiActionType } from './OpenApiActionType';

// Stories never see the service config, so building the document is an action:
// the processor holds the config and does the walk.
export const askOpenApiGetDocument = createActionRequester<OpenApiDocument>()({
  actionType: OpenApiActionType.GetDocument,
  getPayload: (options: OpenApiDocumentOptions = {}) => ({ options }),
});
