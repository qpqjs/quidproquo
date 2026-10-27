import { AskResponse, askStorageScopeProvide } from 'quidproquo-core';
import { HTTPEvent } from 'quidproquo-webserver';

import { askTenantResolveRequestScope } from './askTenantResolveRequestScope';

// The one-call tenant gate for CUSTOM routes (anything not bridged through the
// eventDoc controllers, which get this via askEventDocProvideRequestScope +
// the collection's scopeResolver): resolve the request's typed scope - the
// membership-checked tenant header (Forbidden on failure) or the caller's own
// personal scope when no header is present - and run the story under it. The
// story NEVER runs unscoped.
export function* askTenantProvideRequestScope<T>(event: HTTPEvent, userDirectoryName: string, story: AskResponse<T>): AskResponse<T> {
  const scope = yield* askTenantResolveRequestScope(event, userDirectoryName);

  return yield* askStorageScopeProvide(scope, story);
}
