import { QpqFunctionRuntime } from './QpqFunctionRuntime';

export type DynamicModuleLoader = (runtime: QpqFunctionRuntime) => Promise<any>;
