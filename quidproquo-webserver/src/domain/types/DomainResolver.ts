import { DomainScope } from './DomainScope';

/**
 * App-authored hostname shape, handed to the deploy tooling (never placed on config). Must be
 * pure and deterministic: it runs at synth and build time only, and its output is
 * materialised into config for the runtime. The returned host must be `scope.rootDomain` or
 * end with `.${scope.rootDomain}`.
 */
export type DomainResolver = {
  resolveHost: (scope: DomainScope) => string;
};
