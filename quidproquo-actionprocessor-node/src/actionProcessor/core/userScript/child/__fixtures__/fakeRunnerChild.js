// A plain CommonJS module, forked as is.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { spawn } = require('node:child_process');

// A stand-in runner child: answers by the function name it is asked to call; a list request reports fixed exports.
process.on('message', (event) => {
  if (event.request.kind === 'listExports') {
    return process.send({ success: true, result: { functions: ['add', 'greet'], nonFunctions: [] } }, () => process.exit(0));
  }
  const { functionName, args } = event.request;
  if (functionName === 'hang') {
    return;
  }
  if (functionName === 'die') {
    process.exit(3);
  }
  // Outlives its call on purpose: ignores SIGTERM, never exits, and leaves a grandchild behind.
  if (functionName === 'survive') {
    process.on('SIGTERM', () => {});
    const grandchild = spawn(process.execPath, ['-e', 'setInterval(() => {}, 1000)'], { stdio: 'ignore' });
    return process.send({ success: true, result: { pid: process.pid, grandchildPid: grandchild.pid } });
  }
  process.send(
    {
      success: true,
      result: { echoed: args, env: Object.keys(process.env).sort(), argv: process.argv.slice(2) },
    },
    () => process.exit(0),
  );
});
