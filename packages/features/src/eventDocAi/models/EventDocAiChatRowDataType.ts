/** Where the content of a chat row lives. The value is what is stored on the row, so a member's value must never change. */
export enum EventDocAiChatRowDataType {
  // On the row itself.
  Inline = 'inline',
  // In a file on the chat blobs drive, because it is too big for a row.
  StorageDrive = 'storageDrive',
}
