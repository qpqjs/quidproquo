import { z } from 'zod/v4';

// What POST /echo/{pathValue} returns: the path and body values, untouched.
export const EchoResponseSchema = z.object({
  pathValue: z.string().describe('The {pathValue} segment of the url'),
  bodyValue: z.string().describe('The bodyValue from the request body'),
});

export type EchoResponse = z.infer<typeof EchoResponseSchema>;
