// Every user-intent event recorded in the admin session event doc. The session
// state is a pure fold of these — replaying the doc reproduces the session.
export enum AdminSessionEventType {
  sessionStarted = 'sessionStarted',
  tabChanged = 'tabChanged',
  searchParamsChanged = 'searchParamsChanged',
  searchRequested = 'searchRequested',
  correlationOpened = 'correlationOpened',
  correlationClosed = 'correlationClosed',
  logCheckToggled = 'logCheckToggled',
  configServiceSelected = 'configServiceSelected',
  configSyncRequested = 'configSyncRequested',
  chatMessageSent = 'chatMessageSent',
  sessionEnded = 'sessionEnded',
}
