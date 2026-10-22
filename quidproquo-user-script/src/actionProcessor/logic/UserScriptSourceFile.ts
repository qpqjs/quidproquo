/** One file of a script project pulled off a drive: its path relative to the project root, and its text. */
export type UserScriptSourceFile = {
  path: string;
  text: string;
};
