import { z } from 'zod/v4';

// The zod side of a route's contract. `body` and `query` are parsed before the
// handler runs, so their inferred types flow into the handler's `input` argument.
// `response` is documentation only; nothing checks the handler's output at runtime.
export type DynamicRouteSchema<TBody = undefined, TQuery = undefined> = {
  summary?: string;
  description?: string;
  tags?: string[];

  body?: z.ZodType<TBody>;
  query?: z.ZodType<TQuery>;
  response?: z.ZodType;
};
