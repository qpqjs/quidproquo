// Each defineEventDocAi instance gets its OWN ws-request queue (subscribed to
// the shared ws events bus) so it never collides with the service's own
// defineServiceRequests queue.
export const eventDocAiQueueName = (storeName: string): string => `${storeName}AiChatQueue`;
