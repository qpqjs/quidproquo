import { QPQConfig } from '../QPQConfig';
import { defineActionProcessors } from './actionProcessors';

export const definePromiseMode = (): QPQConfig => [
  defineActionProcessors({
    basePath: __dirname,
    relativePath: '../../proiseify/getSystemExecuteStoryActionProcessor',
    functionName: 'getSystemExecuteStoryActionProcessor',
  }),
];
