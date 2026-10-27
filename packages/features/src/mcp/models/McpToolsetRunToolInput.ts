import { HTTPEvent } from '@qpqjs/webserver';

/** What a toolset's `runTool` inline function receives. */
export type McpToolsetRunToolInput = {
  name: string;
  args: Record<string, unknown>;
  event: HTTPEvent;
};
