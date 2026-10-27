import { WebEntryQPQWebServerConfigSetting } from 'quidproquo-webserver';

/** One web entry the dev server hosts on its own port when serving pre-built web. */
export type WebEntryHost = {
  service: string;
  entryName: string;
  port: number;
  webEntry: WebEntryQPQWebServerConfigSetting;
  // The service's config root, which the entry's `buildPath` is relative to.
  configRoot: string;
};
