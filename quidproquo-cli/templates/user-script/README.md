# __PACKAGE_NAME__

A quidproquo user script. It builds to one JavaScript file that a quidproquo service loads from a storage drive and calls by export name.

## The contract

- The entry is `src/main.ts`. Split the code across other files and folders as you like; the build folds them in.
- Every export of `src/main.ts` must be a function. A generator export runs as a story: it yields quidproquo actions (file reads and writes, network calls, and so on) and its return value is what the caller gets. A plain function export returns its value.
- Import from `quidproquo-core`. npm packages you add to `package.json` are bundled into the output. Node builtins such as `fs` are refused at build time.

## Build

```
npm run build
```

Writes `dist/main.js`, and nothing else. Add `--source-map` to the build to embed a source map in it (no separate `.map` file is written). The build needs no `npm install`: `quidproquo-core` is provided by the service that runs the script, and the build does not type check. Run `npm install` for editor types and `npm run validate-ts` to type check.

## Run

Copy `dist/main.js` to a storage drive, for example to `scripts/my-script/main.js`, then call it from a story, naming that file and passing the arguments after the export name:

```ts
const sum = yield* askUserScriptExecute('my-drive', 'scripts/my-script/main.js', 'add', 'my-drive', 'out.txt', 20, 22);
```

On the dev server a drive is a folder under `.qpq-runtime/<app>/storage/<service>/<drive>/`, so `qpq script:build . --out <that folder>/scripts/my-script` publishes locally to `scripts/my-script/main.js`.
