import { EitherActionResult } from '../../types/Action';

/** What the runner answers: the call's result, or the error the execute catalog (or the script's own story) produced. */
export type UserScriptRunnerResult = EitherActionResult<unknown>;
