// Body of a POST to Neptune's /openCypher HTTP endpoint.
export type NeptuneCypherRequest = {
  query: string;
  parameters?: Record<string, unknown>;
};
