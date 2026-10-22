# smoke-user-script

The user script the test service's smoke suite proves end to end. The service's `build` script bundles it with `qpq script:build` and writes the output into a generated constant, which the `userScript` smoke test stores on the probe drive and calls by export name on the dev server and on lambda.

`src/main.ts` exports `add` (a story that writes a file and returns a sum) and `greet` (plain). The greeting comes from `src/helpers/formatGreeting.ts` so the build has two files to fold together.
