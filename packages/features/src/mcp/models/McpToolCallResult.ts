/** The `tools/call` result. A failed tool sets `isError` so the client's model sees the message and can react. */
export type McpToolCallResult = {
  content: { type: 'text'; text: string }[];
  isError?: boolean;
};
