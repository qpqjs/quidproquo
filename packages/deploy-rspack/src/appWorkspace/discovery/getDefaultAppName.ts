import { Nullable } from '@qpqjs/core';

import { getAvailableAppNames } from './getAvailableAppNames';

/** The first app under apps/, for tooling that runs without an app named; null when there is none. */
export const getDefaultAppName = (root: string): Nullable<string> => getAvailableAppNames(root)[0] ?? null;
