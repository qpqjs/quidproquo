import { HTTPEvent } from '@qpqjs/webserver';

/** What a toolset's `listTools` inline function receives. */
export type McpToolsetListToolsInput = {
  event: HTTPEvent;
};
