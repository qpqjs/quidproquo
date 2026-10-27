import { createActionRequester } from 'quidproquo-core';

import { OpenApiDocument } from '../../types/OpenApiDocument';
import { OpenApiDocumentOptions } from '../../utils/openApi/OpenApiDocumentOptions';
import { OpenApiActionType } from './OpenApiActionType';

export type OpenApiGetDocumentActionPayload = {
  options: OpenApiDocumentOptions;
};

// Stories never see the service config, so building the document is an action:
// the processor holds the config and does the walk.
export const askOpenApiGetDocument = createActionRequester<OpenApiDocument>()({
  actionType: OpenApiActionType.GetDocument,
  getPayload: (options: OpenApiDocumentOptions = {}) => ({ options }),
});
