/** How askEventDocAiLoadChatRows shows the rows it loads. */
export enum EventDocAiLoadChatRowsMode {
  // Each page is shown as it arrives, above the ones already there. For a chat just opened, which starts empty.
  ShowEachPage = 'showEachPage',
  // Nothing changes until every page is in, then the rows are replaced in one go. For reloading a chat already on screen.
  ReplaceWhenLoaded = 'replaceWhenLoaded',
}
