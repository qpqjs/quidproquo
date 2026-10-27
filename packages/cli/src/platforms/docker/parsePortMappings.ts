export type PortMapping = {
  host: number;
  container: number;
};

const PAIR_PATTERN = /^(\d{1,5}):(\d{1,5})$/;

/** Parses "host:container, ..." into pairs, throwing naming the first malformed item. */
export const parsePortMappings = (value: string): PortMapping[] =>
  value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
    .map((item) => {
      const match = PAIR_PATTERN.exec(item);
      if (!match) {
        throw new Error(`Port mapping '${item}' must be host:container, e.g. 80:8080`);
      }
      return { host: Number(match[1]), container: Number(match[2]) };
    });

/** Throws when a mapping targets a port the image does not listen on. */
export const assertContainerPorts = (mappings: PortMapping[], containerPorts: number[]): void => {
  const unknown = mappings.filter((mapping) => !containerPorts.includes(mapping.container));
  if (unknown.length > 0) {
    throw new Error(
      `Port mapping(s) ${unknown.map((m) => `'${m.host}:${m.container}'`).join(', ')} target ports the image does not listen on (${containerPorts.join(', ')})`,
    );
  }
};
