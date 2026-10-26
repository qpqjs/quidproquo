# smoke-user-script

The user script the test service's smoke suite proves end to end. The service's `build` script gathers its sources into generated constants, which the `userScript` smoke test stores on the probe drive, builds on the platform and calls by export name, inside the sandbox, on the dev server and on lambda.

`src/main.ts` exports `add` and `greet` (plain), `stampedGreeting` (a story that yields `askDateNow`, which the sandbox allows) and `writeFile` (a story that yields a file write, which the sandbox refuses; the test asserts it fails and nothing is written). `startSurvivor` leaves a process behind on purpose and `checkSurvivor`, called next, must find it gone. The greeting comes from `src/helpers/formatGreeting.ts` so the build has two files to fold together.
