import { StorySession } from '../../types/StorySession';

/**
 * What the host sends the sandboxed runner for one call. The script is fetched from
 * `sourceUrl` (a temporary read URL the host generated), so the runner needs no drive
 * access; `filename` only names it in errors and stack traces.
 */
export type UserScriptRunnerEvent = {
  sourceUrl: string;
  filename: string;
  functionName: string;
  args: unknown[];
  storySession: StorySession;
};
