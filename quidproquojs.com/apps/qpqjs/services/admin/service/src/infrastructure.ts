import { defineDevServerOptions } from 'quidproquo-dev-server/config';

import { QpqjsServiceEnum } from '@qpqjs/constants';
import { defineQpqjsService } from '@qpqjs/service-utils';

export default [
  defineDevServerOptions({ views: { port: 3082 } }),

  // never change the app name, it will result in a new stack!
  defineQpqjsService(
    QpqjsServiceEnum.Admin,
    __dirname,
    '../../../../../../dist/apps/qpqjs/services/admin/service'
  ),
];
