import { DeployEventType } from 'quidproquo-core';

export type MigrationInfo = {
  srcPath: string;
  deployType: DeployEventType;
};
