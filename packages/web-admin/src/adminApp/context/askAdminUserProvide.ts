import { createContextProvider } from '@qpqjs/core';

import { AdminUserContext } from '../types/AdminUserContext';
import { adminUserContext } from './adminUserContext';

export const askAdminUserProvide = createContextProvider(adminUserContext, (adminUser: AdminUserContext) => adminUser);
