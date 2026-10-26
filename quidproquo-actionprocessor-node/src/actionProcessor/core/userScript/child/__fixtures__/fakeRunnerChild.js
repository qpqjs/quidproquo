// A stand-in runner child: answers by the function name it is asked for.
process.on('message', (event) => {
  if (event.functionName === 'hang') {
    return;
  }
  if (event.functionName === 'die') {
    process.exit(3);
  }
  process.send(
    {
      success: true,
      result: { echoed: event.args, env: Object.keys(process.env).sort(), argv: process.argv.slice(2) },
    },
    () => process.exit(0),
  );
});
