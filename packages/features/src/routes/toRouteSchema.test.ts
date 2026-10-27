import { describe, expect, it } from 'vitest';
import { z } from 'zod/v4';

import { toRouteSchema } from './toRouteSchema';

describe('toRouteSchema', () => {
  it('converts each zod schema to json schema and drops the $schema marker', () => {
    const routeSchema = toRouteSchema({
      summary: 'Create a widget',
      tags: ['widgets'],
      body: z.object({ name: z.string().min(1) }),
      query: z.object({ dryRun: z.string().optional() }),
      response: z.object({ id: z.string() }),
    });

    expect(routeSchema.summary).toBe('Create a widget');
    expect(routeSchema.tags).toEqual(['widgets']);
    expect(routeSchema.bodyJsonSchema).toEqual({
      type: 'object',
      properties: { name: { type: 'string', minLength: 1 } },
      required: ['name'],
    });
    expect(routeSchema.queryJsonSchema).toMatchObject({ properties: { dryRun: { type: 'string' } } });
    expect(routeSchema.queryJsonSchema).not.toHaveProperty('required');
    expect(routeSchema.responseJsonSchema).toMatchObject({ required: ['id'] });
    expect(routeSchema.bodyJsonSchema).not.toHaveProperty('$schema');
  });

  it('documents request schemas from the input side so defaults stay optional', () => {
    const routeSchema = toRouteSchema({ body: z.object({ limit: z.number().default(10) }) });

    expect(routeSchema.bodyJsonSchema).toMatchObject({ properties: { limit: { type: 'number', default: 10 } } });
    expect(routeSchema.bodyJsonSchema).not.toHaveProperty('required');
  });

  it('omits undeclared parts rather than setting them to undefined', () => {
    expect(toRouteSchema({})).toEqual({});
    expect(toRouteSchema({ tags: ['a'] })).toEqual({ tags: ['a'] });
  });
});
