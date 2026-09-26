import { WebEntryHost } from './WebEntryHost';
import { WebEntryRoute } from './WebEntryRoute';

/** Where every web entry of an app is served when the dev server hosts pre-built web. */
export type WebEntryPlacements = {
  hosts: WebEntryHost[];
  // Subdomain routes first, the root entry (if any) last, so mounting in order keeps `/` as the fallback.
  routes: WebEntryRoute[];
};
