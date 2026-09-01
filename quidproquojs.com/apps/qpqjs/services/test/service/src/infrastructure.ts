import { defineKeyValueStore } from 'quidproquo';
import { defineDevServerOptions } from 'quidproquo-dev-server/config';

import { QpqjsServiceEnum } from '@qpqjs/constants';
import { defineQpqjsService } from '@qpqjs/service-utils';

import { defineSmokeEndpoint } from './smoke/config/defineSmokeEndpoint';
import { SMOKE_RUNS_STORE } from './smoke/constants/SMOKE_RUNS_STORE';

export default [
  defineDevServerOptions({ port: 3083 }),

  // never change the app name, it will result in a new stack!
  defineQpqjsService(
    QpqjsServiceEnum.Test,
    __dirname,
    '../../../../../../dist/apps/qpqjs/services/test/service'
  ),

  // Smoke run records: POST /smoke/run writes one, GET /smoke/run/{runId}
  // polls it. Part 3 grows what a run writes, not where it lives.
  defineKeyValueStore(SMOKE_RUNS_STORE, 'runId'),

  defineSmokeEndpoint(),
];
