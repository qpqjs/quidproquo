/**
 * Everything a domain resolver is told when asked for one hostname: which root, which
 * deploy, and which part of the app the host is for. `service` is set for hosts scoped to
 * one service (a websocket or web entry that is not on the root domain); `subdomain` is the
 * app-level label (`api`, `views`, `ws`); both absent means the site root itself.
 */
export type DomainScope = {
  rootDomain: string;
  environment: string;
  feature?: string;
  service?: string;
  subdomain?: string;
};
