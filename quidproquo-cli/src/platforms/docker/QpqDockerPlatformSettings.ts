/** The docker entry's `platformSettings`: how the container's ports map onto the host. */
export type QpqDockerPlatformSettings = {
  // Comma-separated docker `host:container` pairs, e.g. "80:8080, 8888:8888, 3090:3090". Container
  // ports are 8080 (api + site), 8888 (websockets), 3001 (file storage), plus the port of every
  // web entry listed in a service's defineDevServerOptions. Default: 80 to the site and every
  // container port to itself.
  portMappings?: string;
};
