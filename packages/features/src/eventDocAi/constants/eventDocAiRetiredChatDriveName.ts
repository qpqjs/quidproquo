/**
 * The drive that held each chat as one history file. Nothing reads or writes it. It stays declared, marked
 * deleteOnRemove, so the release that stops declaring it deletes it and the files in it.
 */
export const eventDocAiRetiredChatDriveName = (storeName: string): string => `${storeName}AiChats`.toLowerCase();
