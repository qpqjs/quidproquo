// Present a free-text prompt and return the trimmed answer ('' when left blank).
// @inquirer/prompts is imported lazily so fully-flagged runs never pay for it.
export const promptText = async (message: string, defaultValue = ''): Promise<string> => {
  const { input } = await import('@inquirer/prompts');
  return (await input({ message, default: defaultValue })).trim();
};
