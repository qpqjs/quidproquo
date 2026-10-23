import { describe, expect, it } from 'vitest';

import { isSafeProjectPath } from './isSafeProjectPath';

describe('isSafeProjectPath', () => {
  it.each(['src/main.ts', 'src/helpers/format.ts', 'package.json'])('accepts %s', (candidate) => {
    expect(isSafeProjectPath(candidate)).toBe(true);
  });

  it.each(['', '/etc/passwd', '../outside.ts', 'src/../../outside.ts', 'src//main.ts', 'src\\main.ts', './src/main.ts', 'src/./main.ts'])(
    'refuses %j',
    (candidate) => {
      expect(isSafeProjectPath(candidate)).toBe(false);
    },
  );
});
