import { Nullable } from 'quidproquo-core';

/** Where one web entry is reachable from the browser, in either addressing mode. */
export type WebEntryAddress = {
  service: string;
  name: string;
  // Subdomain mode: the resolved host per root domain, in `WebAddressing.rootDomains` order.
  hosts: string[];
  // Port mode: the host-side port when the entry has its own listener, else null (served at `path` on the api origin).
  port: Nullable<number>;
  // Port mode: '/' for the root-domain entry, '/<subdomain>' otherwise.
  path: string;
};
