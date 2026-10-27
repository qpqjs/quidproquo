// One shared builder for the ws method key, used by BOTH the frontend
// composites (askServiceRequest) and defineEventDocAi's queue-processor map —
// the two sides must agree exactly.
export const buildEventDocAiMethodName = (type: string, method: string): string => `eventDocAi/${type}/${method}`;
