/** The unscoped websocket topic a document's head-moved pushes go to; the queue scopes it per connection and sender. */
export const eventDocHeadMovedTopic = (storeName: string, docId: string): string => `eventDoc#${storeName}#${docId}`;
