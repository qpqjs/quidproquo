// Present a single-choice list prompt and return the selected value.
// @inquirer/prompts is imported lazily so fully-flagged runs never pay for it.
export const promptSelect = async (message: string, choices: string[], defaultChoice?: string): Promise<string> => {
  const { select } = await import('@inquirer/prompts');
  return select({ message, choices, default: defaultChoice });
};
