import {
  defineStorageDrive,
  defineWebEntry,
  QPQConfigAdvancedWebEntrySettings,
} from 'quidproquo';
import { defineDevServerOptions } from 'quidproquo-dev-server/config';
import { defineDynamicRoutes } from 'quidproquo-features';

import { QpqjsServiceEnum } from '@qpqjs/constants';
import { defineQpqjsService } from '@qpqjs/service-utils';

import * as dynamicRoutes from './entry/controller';

const webBuildPath = '../../../../../../dist/apps/qpqjs/services/shell/views';

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

// The Docusaurus docs site. No storage drive: the web entry owns its bucket,
// and autoUpload (the default) packages docusaurus/build as a CDK asset at
// synth time, uploads it at deploy time, and invalidates the distribution —
// so `docusaurus` must be built before the web stack deploys.
const docsWebEntryOptions: QPQConfigAdvancedWebEntrySettings = {
  buildPath: '../../../../../../docusaurus/build',
  cacheSettingsName: 'default',
  domain: {
    subDomainName: 'docs',
    onRootDomain: true,
  },
};

export default [
  defineDevServerOptions({ port: 3080 }),

  // never change the app name, it will result in a new stack!
  defineQpqjsService(
    QpqjsServiceEnum.Shell,
    __dirname,
    '../../../../../../dist/apps/qpqjs/services/shell/service'
  ),

  defineStorageDrive(websiteWebEntryStorageDriveName),
  defineWebEntry('website', webEntryOptions),

  defineStorageDrive(mfeHostWebEntryStorageDriveName),
  defineWebEntry('views', mfeHostWebEntryOptions),

  defineWebEntry('docs', docsWebEntryOptions),

  defineDynamicRoutes(dynamicRoutes),
];
