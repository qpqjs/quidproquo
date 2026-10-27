import { createBrandGuard } from 'quidproquo-core';

import { QpqPermission } from '../types/QpqPermission';

const QPQ_PERMISSION_PATTERN = /^[A-Za-z0-9_-]+(:[A-Za-z0-9_-]+)+$/;

/** True for two or more colon-separated segments of letters, digits, `_` or `-`. */
export const isQpqPermission = createBrandGuard<string, QpqPermission>((value) => QPQ_PERMISSION_PATTERN.test(value));
