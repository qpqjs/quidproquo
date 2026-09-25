import { PortMapping } from './parsePortMappings';

/** Each container port on the same host port, plus 80 for the site, when the deployment sets no `portMappings`. */
export const getDefaultPortMappings = (containerPorts: number[]): PortMapping[] => [
  { host: 80, container: 8080 },
  ...containerPorts.map((port) => ({ host: port, container: port })),
];
