import { defineDevServerOptions } from 'quidproquo-dev-server/config';

import { QpqjsServiceEnum } from '@qpqjs/constants';
import { defineQpqjsService } from '@qpqjs/service-utils';

export default [
  defineDevServerOptions({ views: { port: 3081 } }),

  // never change the app name, it will result in a new stack!
  defineQpqjsService(
    QpqjsServiceEnum.Design,
    __dirname,
    '../../../../../../dist/apps/qpqjs/services/design/service'
  ),
];
