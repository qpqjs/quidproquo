import { createActionRequester } from 'quidproquo-core';

import { McpEventDocAi } from '../models/McpEventDocAi';
import { McpEventDocAiActionType } from './McpEventDocAiActionType';

/** Every eventDoc AI in the service with its collection's store and its tools, read from config at runtime. */
export const askMcpEventDocAiReadConfig = createActionRequester<McpEventDocAi[]>()({
  actionType: McpEventDocAiActionType.ReadConfig,
});
