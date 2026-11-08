import { QpqLambdaKind } from './QpqLambdaKind';

/** `<name>-<kind>`, the base a service lambda's deployed name is built from. */
export const getLambdaBaseName = (name: string, kind: QpqLambdaKind): string => `${name}-${kind}`;
