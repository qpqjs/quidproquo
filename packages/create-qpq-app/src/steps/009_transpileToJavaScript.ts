import fs from 'fs';
import path from 'path';

import { listFilesRecursive } from '../lib/listFilesRecursive';
import { readJsonFile } from '../lib/readJsonFile';
import { writeJsonFile } from '../lib/writeJsonFile';
import { AppLanguage, CreateQpqAppStep } from '../types';

// Convert the scaffolded TypeScript app to JavaScript: per-file type
// stripping (JSX preserved, comments kept), then remove the TypeScript
// build plumbing the app no longer needs.
//
// The qpq toolchain runs the result as-is: the CLI's ts-node require hook
// compiles the app's ESM-syntax .js at load time (allowJs, added below), and
// rspack bundles .js/.jsx natively.
export const transpileToJavaScript: CreateQpqAppStep = {
  name: 'Converting to JavaScript',

  shouldRun: (answers) => answers.language === AppLanguage.javascript,

  run: async ({ targetDirectory }) => {
    // Lazy so TypeScript scaffolds never load the compiler.
    /* eslint-disable @typescript-eslint/no-require-imports */
    const ts = require('typescript') as typeof import('typescript');
    const prettier = require('prettier') as typeof import('prettier');
    /* eslint-enable @typescript-eslint/no-require-imports */

    // The transpiler re-prints files in its own style; format the output with
    // the app's own prettier settings so generated code matches the repo.
    const prettierRcPath = path.join(targetDirectory, '.prettierrc');
    const prettierOptions = fs.existsSync(prettierRcPath) ? readJsonFile(prettierRcPath) : {};

    const compilerOptions: import('typescript').CompilerOptions = {
      target: ts.ScriptTarget.ESNext,
      module: ts.ModuleKind.ESNext, // keep import/export statements as written
      jsx: ts.JsxEmit.Preserve,
      removeComments: false,
    };

    let converted = 0;
    for (const filePath of listFilesRecursive(targetDirectory)) {
      if (filePath.endsWith('.d.ts')) {
        fs.rmSync(filePath);
        continue;
      }

      const isTsx = filePath.endsWith('.tsx');
      if (!isTsx && !filePath.endsWith('.ts')) {
        continue;
      }

      const source = fs.readFileSync(filePath, 'utf8');
      const { outputText } = ts.transpileModule(source, { compilerOptions, fileName: filePath });

      // Type-only statements leave blank gaps behind; collapse runs of them.
      const collapsed = outputText.replace(/\n{3,}/g, '\n\n');

      const outputPath = filePath.replace(/\.tsx?$/, isTsx ? '.jsx' : '.js');
      const output = await prettier.format(collapsed, { ...prettierOptions, filepath: outputPath });

      fs.writeFileSync(outputPath, output);
      fs.rmSync(filePath);
      converted += 1;
    }

    // TypeScript build plumbing: tsconfigs, the ambient types/ dir, and the
    // per-package tsc scripts all go. Lib packages no longer build; their
    // package.json main points straight at src.
    let libsRepointed = 0;
    for (const filePath of listFilesRecursive(targetDirectory)) {
      const baseName = path.basename(filePath);

      if (baseName.startsWith('tsconfig') && baseName.endsWith('.json') && filePath !== path.join(targetDirectory, 'tsconfig.json')) {
        fs.rmSync(filePath);
        continue;
      }

      if (baseName === 'package.json' && filePath !== path.join(targetDirectory, 'package.json')) {
        const packageJson = readJsonFile(filePath);
        let changed = false;

        if (packageJson.scripts?.['validate-ts']) {
          delete packageJson.scripts['validate-ts'];
          changed = true;
        }

        // Lib packages (identified by their tsc build) get served from
        // source. A tsc build with an unexpected main means the template's
        // conventions moved: fail loudly rather than scaffold a broken app.
        if (packageJson.scripts?.build === 'tsc -b') {
          if (packageJson.main !== './dist/src/index.js') {
            throw new Error(
              `${filePath} has a tsc build but main is "${packageJson.main}" (expected "./dist/src/index.js"). Update transpileToJavaScript for the new template convention.`,
            );
          }

          packageJson.main = './src/index.js';
          delete packageJson.typings;
          delete packageJson.scripts.build;
          packageJson.exports = { '.': { default: './src/index.js' } };
          packageJson.files = ['src'];
          changed = true;
          libsRepointed += 1;
        }

        if (changed) {
          writeJsonFile(filePath, packageJson);
        }
      }
    }

    if (converted === 0 || libsRepointed === 0) {
      throw new Error(
        `JavaScript conversion looks wrong: ${converted} files transpiled, ${libsRepointed} lib packages repointed. Has the template changed shape?`,
      );
    }

    // The ROOT tsconfig.json stays: the qpq CLI's ts-node require hook reads
    // its ts-node block, and allowJs makes that hook compile the app's
    // ESM-syntax .js files (imports, __dirname) at load time.
    fs.rmSync(path.join(targetDirectory, 'types'), { recursive: true, force: true });
    fs.rmSync(path.join(targetDirectory, 'tsconfig.base.json'), { force: true });

    const rootTsconfigPath = path.join(targetDirectory, 'tsconfig.json');
    const rootTsconfig = readJsonFile(rootTsconfigPath);
    rootTsconfig['ts-node'].compilerOptions.allowJs = true;
    // Scope the hook to this repo: allowJs must never recompile quidproquo
    // libs living outside node_modules (file:-linked dev setups).
    rootTsconfig['ts-node'].scope = true;
    rootTsconfig['ts-node'].scopeDir = '.';
    writeJsonFile(rootTsconfigPath, rootTsconfig);

    const rootPackageJsonPath = path.join(targetDirectory, 'package.json');
    const rootPackageJson = readJsonFile(rootPackageJsonPath);
    delete rootPackageJson.scripts?.['validate-ts'];
    writeJsonFile(rootPackageJsonPath, rootPackageJson);

    console.log(`  Converted ${converted} files to JavaScript.`);
  },
};
