import { z } from 'zod/v4';

// Body of POST /echo/{pathValue}: one value to be sent straight back.
export const EchoRequestSchema = z.object({
  bodyValue: z.string().min(1).describe('Any text; it comes back unchanged'),
});

export type EchoRequest = z.infer<typeof EchoRequestSchema>;
