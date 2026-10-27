#!/usr/bin/env node
import { runCreateQpqApp } from '../cli/runCreateQpqApp';

runCreateQpqApp(process.argv.slice(2)).catch((error: Error) => {
  console.error(`\ncreate-qpq-app failed: ${error.message}`);
  process.exit(1);
});
