import { defineDevServerOptions } from 'quidproquo-dev-server/config';

import { TodoServiceEnum } from '@todo/constants';
import { defineTodoService } from '@todo/service-utils';

export default [
  defineDevServerOptions({ views: { port: 3084 } }),

  // never change the app name, it will result in a new stack!
  defineTodoService(
    TodoServiceEnum.Todo,
    __dirname,
    '../../../../../../dist/apps/todo/services/todo/service'
  ),
];
