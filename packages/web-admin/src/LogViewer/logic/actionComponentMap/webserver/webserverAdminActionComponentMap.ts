import { AdminActionType, askAdminGetLog, askAdminGetLogs } from 'quidproquo-webserver';

const webserverAdminActionComponentMap: Record<string, string[]> = {
  [AdminActionType.GetLog]: ['askAdminGetLog', 'correlationId'],
  [AdminActionType.GetLogMetadata]: ['askAdminGetLogMetadata', 'correlationId'],
  [AdminActionType.GetLogMetadataChildren]: ['askAdminGetLogMetadataChildren', 'correlationId', 'nextPageKey'],
  [AdminActionType.GetLogs]: ['askAdminGetLogs', 'runtimeType', 'startIsoDateTime', 'endIsoDateTime', 'nextPageKey'],
};

export default webserverAdminActionComponentMap;
