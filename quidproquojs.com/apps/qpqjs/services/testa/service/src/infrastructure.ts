import { defineDevServerOptions } from 'quidproquo-dev-server/config';

import { QpqjsServiceEnum } from '@qpqjs/constants';
import { defineQpqjsService } from '@qpqjs/service-utils';

import { defineCrossServiceProbe } from './crossServiceProbe/config/defineCrossServiceProbe';

// testa exists to be "the other service" in the smoke suite: it owns nothing
// of its own and exercises the cross-service (foreign ARN) IAM grants against
// resources the test service owns.
export default [
  defineDevServerOptions({ port: 3084 }),

  // never change the app name, it will result in a new stack!
  defineQpqjsService(
    QpqjsServiceEnum.TestA,
    __dirname,
    '../../../../../../dist/apps/qpqjs/services/testa/service'
  ),

  defineCrossServiceProbe(),
];
