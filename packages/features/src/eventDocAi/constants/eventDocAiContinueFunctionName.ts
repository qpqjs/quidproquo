// The service function a chat turn hands itself to before the runtime deadline.
// One per defineEventDocAi instance, keyed like the queue.
export const eventDocAiContinueFunctionName = (storeName: string): string => `${storeName}AiChatContinue`;
