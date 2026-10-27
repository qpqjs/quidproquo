import { DeployEventType } from '@qpqjs/core';

export type MigrationInfo = {
  srcPath: string;
  deployType: DeployEventType;
};
