/**
 * The inline function behind a collection's setChatName tool. Named per collection, like the continuation
 * function, so a service with several chat collections declares no function twice.
 */
export const eventDocAiSetChatNameFunctionName = (storeName: string): string => `${storeName}AiSetChatName`;
