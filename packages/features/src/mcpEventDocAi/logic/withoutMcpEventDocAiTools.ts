import { McpEventDocAi } from '../models/McpEventDocAi';

/** The AIs with the named tools taken out of their tool lists. */
export const withoutMcpEventDocAiTools = (eventDocAis: McpEventDocAi[], excludedToolNames: string[]): McpEventDocAi[] =>
  eventDocAis.map((eventDocAi) => ({ ...eventDocAi, tools: eventDocAi.tools.filter(({ name }) => !excludedToolNames.includes(name)) }));
