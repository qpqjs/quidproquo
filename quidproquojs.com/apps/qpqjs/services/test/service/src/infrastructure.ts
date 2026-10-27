import { QpqjsServiceEnum } from '@qpqjs/constants';
import { defineDevServerOptions } from '@qpqjs/dev-server/config';
import { defineQpqjsService } from '@qpqjs/service-utils';
import {
  defineUserScriptBuilder,
  getUserScriptBuilderApiLayer,
} from '@qpqjs/user-script';
import { defineUserScriptRunner } from 'quidproquo';

import { defineSmoke } from './smoke/config/defineSmoke';

export default [
  defineDevServerOptions({ views: { port: 3083 } }),

  // never change the app name, it will result in a new stack!
  // The rspack layer is written by the app's qpq:predeploy hook (see apps/qpqjs/package.json).
  defineQpqjsService(
    QpqjsServiceEnum.Test,
    __dirname,
    '../../../../../../dist/apps/qpqjs/services/test/service',
    [getUserScriptBuilderApiLayer()]
  ),

  // The smoke suite builds its user script on the platform and runs it in the sandbox.
  defineUserScriptBuilder(),
  defineUserScriptRunner(),

  defineSmoke(),
];
