/** A finished build, read back from disk, ready to publish to a drive. */
export type BuiltUserScript = {
  // The built JavaScript, with its source map embedded when one was asked for.
  script: string;
  exports: string[];
};
