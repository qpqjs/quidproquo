/* eslint-disable jsdoc/require-jsdoc */
/* eslint-disable qpq/filename-matches-export */
export enum WebsocketAdminClientMessageEventType {
  RefreshLogMetadata = 'qpq/admin/ws/RefreshLogMetadata',
  MarkLogChecked = 'qpq/admin/ws/MarkLogChecked',
  ConfigSyncRequest = 'qpq/admin/ws/ConfigSyncRequest',
  EventDocReprojectRequest = 'qpq/admin/ws/EventDocReprojectRequest',
}
