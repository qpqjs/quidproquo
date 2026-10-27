export interface QpqContextIdentifier<T> {
  uniqueName: string;
  defaultValue: T;

  // Service-local context lives in a separate bag (StorySession.localContext)
  // that is never serialized across a service boundary.
  local?: boolean;
}

export type QpqContext<T> = Record<QpqContextIdentifier<T>['uniqueName'], T>;
