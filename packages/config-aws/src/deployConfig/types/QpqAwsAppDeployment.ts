import { QpqAppDeployment } from 'quidproquo-core';

import { QpqAwsPlatformSettings } from './QpqAwsPlatformSettings';

export type QpqAwsAppDeployment = QpqAppDeployment & {
  platformSettings: QpqAwsPlatformSettings;
};
