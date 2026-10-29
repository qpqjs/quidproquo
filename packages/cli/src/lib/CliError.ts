// A failure the command layer turns into an exit code and one line of output. Library code
// throws this instead of printing and exiting itself, so it stays usable from anywhere.
export class CliError extends Error {
  readonly exitCode: number;

  constructor(message: string, exitCode: number = 1) {
    super(message);
    this.name = 'CliError';
    this.exitCode = exitCode;
  }
}
