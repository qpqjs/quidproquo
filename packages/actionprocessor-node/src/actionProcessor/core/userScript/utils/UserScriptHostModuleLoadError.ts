/** A module the service declared for user scripts (defineUserScriptModule) did not load. */
export class UserScriptHostModuleLoadError extends Error {
  constructor(moduleName: string) {
    super(`User script module [${moduleName}] could not be loaded; check its defineUserScriptModule runtime`);
    this.name = 'UserScriptHostModuleLoadError';
  }
}
