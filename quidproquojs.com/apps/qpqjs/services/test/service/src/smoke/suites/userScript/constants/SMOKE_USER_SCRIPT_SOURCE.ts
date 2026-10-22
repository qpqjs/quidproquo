/**
 * The hand-written CommonJS user script the suite stores on the probe drive. It
 * requires only the shared framework package and exports one generator (a story
 * that writes a file, proving its actions run through the real processors) and one
 * plain function. The drive and path come in as args so the script holds no constants.
 */
export const SMOKE_USER_SCRIPT_SOURCE = `
const { askFileWriteTextContents } = require('quidproquo-core');

exports.add = function* (drive, filepath, a, b) {
  const sum = a + b;
  yield* askFileWriteTextContents(drive, filepath, 'added ' + sum);
  return sum;
};

exports.greet = (name) => 'hello ' + name;
`;
