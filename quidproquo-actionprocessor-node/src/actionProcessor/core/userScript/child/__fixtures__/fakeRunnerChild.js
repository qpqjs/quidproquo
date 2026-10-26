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
  process.send(
    {
      success: true,
      result: { echoed: args, env: Object.keys(process.env).sort(), argv: process.argv.slice(2) },
    },
    () => process.exit(0),
  );
});
