import { SMOKE_PROBE_DRIVE } from '@qpqjs/constants';
import {
  askFileDelete,
  askFileExists,
  askFileReadTextContents,
  askFileWriteBinaryContents,
  askNewGuid,
  AskResponse,
  askUserScriptBuildFromZip,
} from 'quidproquo';

import { askSmokeAssert } from '../../../harness/assert/askSmokeAssert';
import { SMOKE_USER_SCRIPT_ZIP_BASE64 } from '../generated/SMOKE_USER_SCRIPT_ZIP_BASE64';
import { askRunSmokeUserScriptCalls } from './askRunSmokeUserScriptCalls';

// The zip form of the user-script loop: the same project arrives as one zip file on
// the drive (wrapped in a top-level folder, as a tool would make it), is built on the
// platform with askUserScriptBuildFromZip, and its exports are then callable by name.
// The build goes to an extensionless, asset-style path with its source map turned on, so
// this also proves the output is exactly one file with the map embedded in it.
export function* askRunUserScriptZipTest(): AskResponse<void> {
  const scriptId = yield* askNewGuid();
  const directory = `smoke/userScript/${scriptId}`;
  const zipPath = `${directory}/script.zip`;
  const builtPath = `${directory}/assets/built`;
  const outputPath = `${directory}/output.txt`;

  yield* askFileWriteBinaryContents(SMOKE_PROBE_DRIVE, zipPath, {
    base64Data: SMOKE_USER_SCRIPT_ZIP_BASE64,
    filename: 'script.zip',
    mimetype: 'application/zip',
  });

  const built = yield* askUserScriptBuildFromZip(SMOKE_PROBE_DRIVE, zipPath, builtPath, undefined, { sourceMap: true });
  yield* askSmokeAssert(
    built.exports.includes('add') && built.exports.includes('greet'),
    `zip build did not report the script's exports: [${built.exports.join(', ')}]`,
  );

  const builtSource = yield* askFileReadTextContents(SMOKE_PROBE_DRIVE, builtPath);
  yield* askSmokeAssert(
    builtSource.includes('//# sourceMappingURL=data:application/json;charset=utf-8;base64,'),
    'zip build with sourceMap on did not embed the source map',
  );
  const separateMapExists = yield* askFileExists(SMOKE_PROBE_DRIVE, `${builtPath}.map`);
  yield* askSmokeAssert(!separateMapExists, 'zip build wrote a separate .map file');

  yield* askRunSmokeUserScriptCalls(builtPath, outputPath, 'zip');

  yield* askFileDelete(SMOKE_PROBE_DRIVE, [zipPath, builtPath, outputPath]);
}
