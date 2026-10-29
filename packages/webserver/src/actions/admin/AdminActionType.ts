import { StoryResultMetadata } from '@qpqjs/core';

export enum AdminActionType {
  GetLog = '@quidproquo-webserver/Admin/GetLog',
  GetLogMetadata = '@quidproquo-webserver/Admin/GetLogMetadata',
  GetLogMetadataChildren = '@quidproquo-webserver/Admin/GetLogMetadataChildren',
  GetLogs = '@quidproquo-webserver/Admin/GetLogs',
}

export type QpqLogList = {
  items: StoryResultMetadata[];
  nextPageKey?: string;
};
