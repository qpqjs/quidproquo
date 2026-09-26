import { WebEntryQPQWebServerConfigSetting } from 'quidproquo-webserver';

/** One web entry served same-origin on the api port, at `/` (the root-domain entry) or `/<subdomain>`. */
export type WebEntryRoute = {
  service: string;
  entryName: string;
  path: string;
  webEntry: WebEntryQPQWebServerConfigSetting;
  // The service's config root, which the entry's `buildPath` is relative to.
  configRoot: string;
};
