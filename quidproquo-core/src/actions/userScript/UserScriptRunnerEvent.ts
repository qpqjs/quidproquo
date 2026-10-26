import { StorySession } from '../../types/StorySession';
import { UserScriptRunnerRequest } from './UserScriptRunnerRequest';

/**
 * What the host sends the sandboxed runner. The script is fetched from `sourceUrl` (a
 * temporary read URL the host generated), so the runner needs no drive access; `filename`
 * only names it in errors and stack traces.
 */
export type UserScriptRunnerEvent = {
  sourceUrl: string;
  filename: string;
  storySession: StorySession;
  request: UserScriptRunnerRequest;
};
