import { HTTPEvent } from '@qpqjs/webserver';

import { MCP_FORWARD_STRIPPED_HEADERS } from '../constants/mcpForwardStrippedHeaders';

/** The MCP request as another service receives it: the same, minus its credentials, which never leave the endpoint. */
export const buildMcpForwardedEvent = (event: HTTPEvent): HTTPEvent => ({
  ...event,
  headers: Object.fromEntries(Object.entries(event.headers ?? {}).filter(([name]) => !MCP_FORWARD_STRIPPED_HEADERS.includes(name.toLowerCase()))),
});
