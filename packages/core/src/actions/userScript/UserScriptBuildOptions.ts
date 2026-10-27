/** Optional settings for a platform build of a user script. */
export type UserScriptBuildOptions = {
  // Embed a source map in the built file (an inline `sourceMappingURL` data comment). Off by
  // default; a build never writes a separate `.map` file.
  sourceMap?: boolean;
};
