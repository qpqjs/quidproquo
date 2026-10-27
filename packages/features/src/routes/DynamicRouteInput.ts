// The parsed, validated request a handler receives as its third argument. Each
// field is `undefined` when the route declared no schema for it.
export type DynamicRouteInput<TBody = undefined, TQuery = undefined> = {
  body: TBody;
  query: TQuery;
};
