import { CreateQpqAppAnswers } from './CreateQpqAppAnswers';
import { StepContext } from './StepContext';

// A self-contained scaffolding step. The pipeline always runs the same list
// top to bottom; each step owns its applicability via shouldRun.
export type CreateQpqAppStep = {
  name: string;
  shouldRun?: (answers: CreateQpqAppAnswers) => boolean;
  run: (context: StepContext) => Promise<void>;
};
