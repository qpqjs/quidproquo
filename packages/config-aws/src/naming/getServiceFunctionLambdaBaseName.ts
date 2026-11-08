import { getLambdaBaseName } from './getLambdaBaseName';
import { QpqLambdaKind } from './QpqLambdaKind';

/** The base name of the lambda that runs a service function. */
export const getServiceFunctionLambdaBaseName = (functionName: string): string => getLambdaBaseName(functionName, QpqLambdaKind.ServiceFunction);
