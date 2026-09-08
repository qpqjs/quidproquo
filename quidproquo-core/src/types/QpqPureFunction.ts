/**
 * A pointer to a named export in a file (`basePath/relativePath` exports `functionName`).
 * Serializable, so config can carry it; the tooling `require`s it under ts-node. Nothing at
 * runtime ever loads one: a pure function referenced this way runs at synth and build time.
 */
export type QpqPureFunction = {
  basePath: string;
  relativePath: string;
  functionName: string;
};
