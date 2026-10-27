// Filesystem discovery for views microfrontends: no central config. Everything
// (aliases, MF names, remotes, ports) is derived from the
// apps/<app>/services/<svc>/views convention and each service's QPQ config.
export type ViewsInfo = {
  service: string;
  appName: string;
  viewsDir: string;
  // The import alias / package name, e.g. @<app>/design-service-views
  alias: string;
  // MF container names must be identifier-safe, e.g. <app>_design_service_views
  mfName: string;
  port: number;
};
