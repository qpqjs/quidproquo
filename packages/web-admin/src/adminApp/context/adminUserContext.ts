import { createContextIdentifier } from '@qpqjs/core';

import { AdminUserContext } from '../types/AdminUserContext';

/** Who is logged in; AdminAppProvider provides it from the auth runtime, empty username outside one. */
export const adminUserContext = createContextIdentifier<AdminUserContext>('qpq-admin-user', { username: '' });
