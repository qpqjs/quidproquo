import { StoryResultMetadata } from 'quidproquo-core';

export enum AdminActionType {
  GetLog = '@quidproquo-webserver/Admin/GetLog',
  GetLogMetadata = '@quidproquo-webserver/Admin/GetLogMetadata',
  GetLogMetadataChildren = '@quidproquo-webserver/Admin/GetLogMetadataChildren',
  GetLogs = '@quidproquo-webserver/Admin/GetLogs',
}

export interface QpqLogList {
  items: StoryResultMetadata[];
  nextPageKey?: string;
}
