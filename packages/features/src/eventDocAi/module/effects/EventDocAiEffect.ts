export enum EventDocAiEffect {
  SetChats = 'eventDocAi/SetChats',
  UpsertChat = 'eventDocAi/UpsertChat',
  SetActiveChat = 'eventDocAi/SetActiveChat',
  SetMessages = 'eventDocAi/SetMessages',
  AppendChatMessage = 'eventDocAi/AppendChatMessage',
  AppendStreamChunk = 'eventDocAi/AppendStreamChunk',
  ClearStream = 'eventDocAi/ClearStream',
  SetLoadingChats = 'eventDocAi/SetLoadingChats',
  SetLoadingHistory = 'eventDocAi/SetLoadingHistory',
  SetSending = 'eventDocAi/SetSending',
  SetError = 'eventDocAi/SetError',
}
