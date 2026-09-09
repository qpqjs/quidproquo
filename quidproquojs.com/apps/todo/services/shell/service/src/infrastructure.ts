import {
  defineStorageDrive,
  defineWebEntry,
  QPQConfigAdvancedWebEntrySettings,
} from 'quidproquo';
import { defineDevServerOptions } from 'quidproquo-dev-server/config';
import { defineDynamicRoutes } from 'quidproquo-features';

import { TodoServiceEnum } from '@todo/constants';
import { defineTodoService } from '@todo/service-utils';

import * as dynamicRoutes from './entry/controller';

const webBuildPath = '../../../../../../dist/apps/todo/services/shell/views';

// shell is the module-federation host: its views bundle is the root website,
// every other service's views hang off views.<domain>/<service>. The deploy
// tooling (qpq go) uploads into these two drives.
const websiteWebEntryStorageDriveName = 'website';
const webEntryOptions: QPQConfigAdvancedWebEntrySettings = {
  buildPath: webBuildPath,

  cacheSettingsName: 'default',
  domain: {
    onRootDomain: true,
  },
  storageDrive: {
    sourceStorageDrive: websiteWebEntryStorageDriveName,
    autoUpload: false,
  },

  ignoreCache: ['index.html', 'remoteEntry.js', 'mf-manifest.json'],
};

const mfeHostWebEntryStorageDriveName = 'views';
const mfeHostWebEntryOptions: QPQConfigAdvancedWebEntrySettings = {
  buildPath: webBuildPath,
  cacheSettingsName: 'default',
  domain: {
    subDomainName: 'views',
    onRootDomain: true,
  },
  storageDrive: {
    sourceStorageDrive: mfeHostWebEntryStorageDriveName,
    autoUpload: false,
  },

  ignoreCache: [
    '*/index.js',
    '*/index.html',
    '*/remoteEntry.js',
    '*/mf-manifest.json',
  ],
};

export default [
  defineDevServerOptions({ port: 3080 }),

  // never change the app name, it will result in a new stack!
  defineTodoService(
    TodoServiceEnum.Shell,
    __dirname,
    '../../../../../../dist/apps/todo/services/shell/service'
  ),

  defineStorageDrive(websiteWebEntryStorageDriveName),
  defineWebEntry('website', webEntryOptions),

  defineStorageDrive(mfeHostWebEntryStorageDriveName),
  defineWebEntry('views', mfeHostWebEntryOptions),

  defineDynamicRoutes(dynamicRoutes),
];
