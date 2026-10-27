import { QpqAppDeployment } from '@qpqjs/core';

import { QpqAwsPlatformSettings } from './QpqAwsPlatformSettings';

export type QpqAwsAppDeployment = QpqAppDeployment & {
  platformSettings: QpqAwsPlatformSettings;
};
