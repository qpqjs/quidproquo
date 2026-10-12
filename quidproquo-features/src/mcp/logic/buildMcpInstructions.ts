import { McpConfig } from '../models/McpConfig';

/** The `instructions` sent on initialize: each toolset's own guidance. */
export const buildMcpInstructions = (config: McpConfig): string =>
  config.toolsets.flatMap(({ instructions }) => (instructions ? [instructions] : [])).join('\n');
