/** Effect types on the default chrome slot (local, so each type coalesces last-write-wins and toggles do not accumulate). */
export enum EventDocWorkspaceChromeEffect {
  SetHistoryOpen = 'workspaceChromeSetHistoryOpen',
  SetHelpOpen = 'workspaceChromeSetHelpOpen',
  SetHistorySlotKey = 'workspaceChromeSetHistorySlotKey',
}
