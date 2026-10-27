type DynamicRouteErrorCode = number;
type DynamicRouteErrorCodeWithMessage = { code: number; message: string };

export type DynamicRouteKnownErrors = {
  [key: string]: DynamicRouteErrorCode | DynamicRouteErrorCodeWithMessage;
};

export const isDynamicRouteErrorCode = (value: DynamicRouteErrorCode | DynamicRouteErrorCodeWithMessage): value is DynamicRouteErrorCode =>
  typeof value === 'number';
