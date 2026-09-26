/** The docker entry's `platformSettings`: how the image is named, built and mapped onto a host. */
export type QpqDockerPlatformSettings = {
  // Comma-separated docker `host:container` pairs, e.g. "80:8080, 8888:8888, 3090:3090". Container
  // ports are 8080 (api + site), 8888 (websockets), 3001 (file storage), plus the port of every
  // web entry listed in a service's defineDevServerOptions. Default: 80 to the site and every
  // container port to itself. The host side is baked into the frontend, so a host must map the
  // same ports.
  portMappings?: string;

  // Registry to push the image to, e.g. "192.168.8.88:5000" or "ghcr.io/me". Without it the image
  // only lands in the local docker store.
  registry?: string;

  // Target platform for the image, e.g. "linux/amd64" for an x86 host built from an arm Mac.
  // Default: the building machine's own.
  arch?: string;

  // Image tag. Default: the deployment's environment.
  tag?: string;
};
