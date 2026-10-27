// Present a single-choice list prompt and return the selected value.
// @inquirer/prompts is imported lazily so commands only pay for it when
// actually prompting.
export const promptSelect = async (message: string, choices: string[], defaultChoice?: string): Promise<string> => {
  const { select } = await import('@inquirer/prompts');
  return select({ message, choices, default: defaultChoice });
};

// A single-choice list prompt over labelled values; a choice's optional
// `short` replaces its name in the answer line once picked, and its optional
// `description` renders under the list while it is highlighted.
export const promptSelectDetailed = async <T>(
  message: string,
  choices: { name: string; value: T; short?: string; description?: string }[],
): Promise<T> => {
  const { select } = await import('@inquirer/prompts');
  return select({ message, choices });
};

// A yes/no list prompt, returning true for "Yes".
export const promptYesNo = async (message: string): Promise<boolean> => (await promptSelect(message, ['No', 'Yes'])) === 'Yes';

// A free-text prompt — used where a y/n is too easy to fat-finger (destructive
// confirmations that require typing the target name back).
export const promptText = async (message: string): Promise<string> => {
  const { input } = await import('@inquirer/prompts');
  return input({ message });
};

// A multi-select checkbox prompt over labelled values; `checked` preselects a choice.
export const promptCheckbox = async <T>(
  message: string,
  choices: { name: string; value: T; checked?: boolean; description?: string }[],
): Promise<T[]> => {
  const { checkbox } = await import('@inquirer/prompts');
  return checkbox({ message, choices });
};
