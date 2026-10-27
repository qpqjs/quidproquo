import { qpqApplicationVersionGlobal } from '../../constants';
import { QPQConfig } from '../QPQConfig';
import { defineGlobal } from './global';

export const defineApplicationVersion = (version: string): QPQConfig => [defineGlobal(qpqApplicationVersionGlobal, version)];
