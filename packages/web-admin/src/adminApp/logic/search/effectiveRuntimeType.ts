import { QpqRuntimeType } from 'quidproquo-core';

import { AdminSearchParams } from '../../types/AdminSearchParams';

export const effectiveRuntimeType = (search: AdminSearchParams): string => search.runtimeType || QpqRuntimeType.EXECUTE_STORY;
