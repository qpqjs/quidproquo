import { createContextReader } from '@qpqjs/core';

import { adminUserContext } from './adminUserContext';

export const askAdminUserRead = createContextReader(adminUserContext);
