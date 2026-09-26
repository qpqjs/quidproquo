/** Host-side ports for port-mode addressing. `mapHostPort` turns a container port into the port the browser reaches it on. */
export type WebAddressingPorts = {
  api: number;
  webSocket: number;
  mapHostPort: (containerPort: number) => number;
};
