/** The ports the generated dev-server entry listens on: api + static web, websockets, file storage secure urls. */
export const DEV_SERVER_PORTS = {
  api: 8080,
  webSocket: 8888,
  fileStorage: 3001,
} as const;
