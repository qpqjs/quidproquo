/** A tool's input schema with arguments its toolset handles itself (a docId, say) added in front of its own properties. */
export const buildMcpToolInputSchema = (schema: Record<string, unknown>, extraProperties: Record<string, unknown>): Record<string, unknown> => ({
  ...schema,
  type: 'object',
  properties: {
    ...extraProperties,
    ...(schema.properties as Record<string, unknown> | undefined),
  },
});
