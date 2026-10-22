/** What a successful user-script build produced. */
export type UserScriptBuildResult = {
  // Absolute path of the single CommonJS output, `<outDir>/main.js`.
  entryPath: string;
  sourceMapPath: string;
  // The own enumerable function exports of the built module, in definition order.
  exports: string[];
};
