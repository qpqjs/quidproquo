/**
 * Represents a runtime function definition that can be either relative or advanced.
 *
 * Example:
 * - Advanced: { basePath: `E:/repo/project/src`, relativePath: `/service/entry/controller/admin::onAuthUpdate` }
 * - Relative: `/entry/controller/admin::onAuthUpdate`
 */
export type QpqFunctionRuntimeRelativePath = `/${string}::${string}`;
export type QpqFunctionRuntimeAdvanced = {
  basePath: string;
  relativePath: string;
  functionName: string;

  // Globals scoped to this function, keyed by global name. When the function's
  // story reads a global via askConfigGetGlobal, a value here takes precedence
  // over the service-wide global of the same name.
  globals?: Record<string, unknown>;

  // Action processor overrides scoped to this function. Each entry points at a
  // getActionProcessors-style function (same contract as a defineActionProcessors
  // source); the returned processors are merged over the platform and service-wide
  // ones for this function's whole execution, last wins. That includes the
  // framework preamble (e.g. route auth decode) and in-process nested executions,
  // which inherit the caller's merged list; transport boundaries (http, queue, ws)
  // start fresh from their own runtime's registration. Footgun: an override can
  // shadow framework-internal actions for that execution, not just app-level ones.
  actionProcessors?: QpqFunctionRuntime[];
};

export type QpqFunctionRuntime = QpqFunctionRuntimeAdvanced | QpqFunctionRuntimeRelativePath;
