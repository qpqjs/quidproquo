/** A service's api (or websocket api) in subdomain mode: the resolved host per root domain. */
export type ApiAddress = {
  service: string;
  apiSubdomain: string;
  hosts: string[];
};
