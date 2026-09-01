import { defineDevServerOptions } from 'quidproquo-dev-server/config';

import { QpqjsServiceEnum } from '@qpqjs/constants';
import { defineQpqjsService } from '@qpqjs/service-utils';

import { defineSmoke } from './smoke/config/defineSmoke';
import { defineTick } from './tick/config/defineTick';

export default [
  defineDevServerOptions({ port: 3083 }),

  // never change the app name, it will result in a new stack!
  defineQpqjsService(
    QpqjsServiceEnum.Test,
    __dirname,
    '../../../../../../dist/apps/qpqjs/services/test/service'
  ),

  defineSmoke(),

  defineTick(),
];
