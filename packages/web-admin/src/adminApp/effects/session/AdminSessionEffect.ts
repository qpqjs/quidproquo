// Every user-intent event recorded in the admin session event doc. The session
// state is a pure fold of these, replaying the doc reproduces the session. The
// values are what the stored logs carry, so they never change.
export enum AdminSessionEffect {
  SessionStarted = 'sessionStarted',
  TabChanged = 'tabChanged',
  SearchParamsChanged = 'searchParamsChanged',
  SearchRequested = 'searchRequested',
  CorrelationOpened = 'correlationOpened',
  CorrelationClosed = 'correlationClosed',
  LogCheckToggled = 'logCheckToggled',
  ConfigServiceSelected = 'configServiceSelected',
  ConfigSyncRequested = 'configSyncRequested',
  ChatMessageSent = 'chatMessageSent',
  SessionEnded = 'sessionEnded',
}
