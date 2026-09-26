/** The dev server's listeners, set per app in `apps/<app>/devServer.config.ts`; a missing one keeps its default. */
export type DevServerPorts = {
  // Api routes and, when serving pre-built web, the site.
  api?: number;
  webSocket?: number;
  // Secure file upload/download urls.
  fileStorage?: number;
};
