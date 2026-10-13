/** Request headers never forwarded to another service: the credentials were checked at the endpoint and go no further. Lower case. */
export const MCP_FORWARD_STRIPPED_HEADERS: readonly string[] = ['authorization', 'cookie', 'x-api-key'];
