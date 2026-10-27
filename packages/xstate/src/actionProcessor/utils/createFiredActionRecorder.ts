/**
 * Builds xstate action implementations that only record which named actions
 * fired. The transition itself must stay synchronous, so the QPQ side-effect
 * stories for the recorded actions run afterwards via runFiredActionStories.
 */
export const createFiredActionRecorder = (actionNames: string[]): { firedActions: string[]; actionImpls: Record<string, () => void> } => {
  const firedActions: string[] = [];
  const actionImpls: Record<string, () => void> = {};

  for (const actionName of actionNames) {
    actionImpls[actionName] = () => {
      firedActions.push(actionName);
    };
  }

  return { firedActions, actionImpls };
};
