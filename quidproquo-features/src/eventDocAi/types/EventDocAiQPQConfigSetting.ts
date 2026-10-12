import { QPQConfigSetting } from 'quidproquo-core';

/** Which AI chats over which collection, and the doc context (`serviceName`, `type`) its tools expect. */
export type EventDocAiQPQConfigSetting = QPQConfigSetting & {
  aiName: string;
  serviceName: string;
  storeName: string;
  type: string;
  userDirectoryName: string;
};
