/** The docker entry's `platformSettings`: how the container's fixed ports map onto the host. */
export type QpqDockerPlatformSettings = {
  // Comma-separated docker `host:container` pairs, e.g. "80:8080, 8888:8888". Container
  // ports are 8080 (api + site), 8888 (websockets), 3001 (file storage). Default: 80 to
  // the site and every container port to itself.
  portMappings?: string;
};
