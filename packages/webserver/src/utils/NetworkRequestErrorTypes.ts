/** The catalog entries a network-backed action maps the transport's failures onto. */
export type NetworkRequestErrorTypes = {
  Timeout: string;
  UnsupportedMethod: string;
  NetworkError: string;
};
