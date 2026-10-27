// Turns a user script module's `types` entry (defineUserScriptModule) into its bundled type
// declarations. The entry is required with USER_SCRIPT_MODULE_TYPES_QUERY, so instead of being
// compiled it becomes a module whose USER_SCRIPT_MODULE_TYPES_EXPORT is one self-contained
// declaration file: the entry's own exports, with the quidproquo types they use inlined (a
// browser editor has no node_modules to find them in), and nothing else exported.
//
// It runs wherever the backend is bundled, so the deployed lambda and the dev server answer
// askUserScriptModuleTypes the same way. In the dev server's watch build the entry's folder is a
// dependency, so editing the module regenerates its declarations.
import { USER_SCRIPT_MODULE_TYPES_EXPORT } from '@qpqjs/core';

import { generateDtsBundle } from 'dts-bundle-generator';
import path from 'path';
import type { LoaderContext } from '@rspack/core';

// TODO: Fix this. A type the harness pulls from any other package (@qpqjs/features, zod)
// is left as an import the browser editor cannot follow, so it shows as `any`. The generator
// matches package names exactly, so build this list in the loader instead: every dependency
// of the nearest package.json to the entry, plus the quidproquo packages.
const INLINED_LIBRARIES = ['quidproquo', '@qpqjs/core', '@qpqjs/webserver'];

const getErrorMessage = (error: unknown): string => (error instanceof Error ? error.message : String(error));

export default function userScriptModuleTypesLoader(this: LoaderContext): void {
  const entryPath = this.resourcePath;
  this.addContextDependency(path.dirname(entryPath));

  let declarations: string;
  try {
    // The nearest tsconfig to the entry supplies the compiler options, as for the entry's own build.
    [declarations] = generateDtsBundle([
      {
        filePath: entryPath,
        libraries: { inlinedLibraries: INLINED_LIBRARIES },
        output: { noBanner: true, exportReferencedTypes: false },
      },
    ]);
  } catch (error) {
    this.callback(new Error(`Could not generate the user script module types for [${entryPath}]:\n${getErrorMessage(error)}`));
    return;
  }

  this.callback(null, `exports[${JSON.stringify(USER_SCRIPT_MODULE_TYPES_EXPORT)}] = ${JSON.stringify(declarations)};\n`);
}
