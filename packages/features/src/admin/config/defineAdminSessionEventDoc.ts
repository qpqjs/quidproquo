import { defineServiceSettings, QPQConfig } from 'quidproquo-core';

import { defineEventDocRoutes, defineEventDocSummary } from '../../eventDoc';
import { adminSessionBasePath, adminSessionDocType, adminSessionStoreName } from '../constants/adminSessionConstants';
import { adminUserDirectoryResourceName } from './adminUserDirectory';

// Admin UI sessions: one event doc per login, every user-intent event appended
// for audit. Scoped to the log service like the other admin-only resources.
// Composed from the low-level pair: the collection registers no functions object
// (no render, no references, no snapshots), which is exactly what defineEventDoc's
// definition form would require.
export const defineAdminSessionEventDoc = (logServiceName: string): QPQConfig => [
  defineServiceSettings({
    [logServiceName]: [
      defineEventDocSummary(adminSessionStoreName),
      defineEventDocRoutes({
        storeName: adminSessionStoreName,
        type: adminSessionDocType,
        basePath: adminSessionBasePath,
        routeAuthSettings: {
          userDirectoryName: adminUserDirectoryResourceName,
        },
      }),
    ],
  }),
];
