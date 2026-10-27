import { HTTPEvent } from 'quidproquo-webserver';

/** What a toolset's `listTools` inline function receives. */
export type McpToolsetListToolsInput = {
  event: HTTPEvent;
};
