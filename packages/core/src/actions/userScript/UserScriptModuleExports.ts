/** A built script's own enumerable exports, in definition order, split by whether each is callable. */
export type UserScriptModuleExports = {
  functions: string[];
  nonFunctions: string[];
};
