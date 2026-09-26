const DEFAULT_PORTS: Record<string, number> = { 'http:': 80, 'https:': 443, 'ws:': 80, 'wss:': 443 };

/** `<protocol>//<host>[:<port>]`, leaving the port off when it is the protocol's default. */
export const formatOrigin = (protocol: string, host: string, port: number): string =>
  DEFAULT_PORTS[protocol] === port ? `${protocol}//${host}` : `${protocol}//${host}:${port}`;
