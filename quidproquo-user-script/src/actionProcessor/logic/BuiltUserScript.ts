/** A finished build, read back from disk, ready to publish to a drive. */
export type BuiltUserScript = {
  script: string;
  sourceMap: string;
  exports: string[];
};
