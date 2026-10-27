import { QpqRuntimeType } from '@qpqjs/core';

export const RuntimeTypes = ['ALL', ...Object.keys(QpqRuntimeType).sort()];
