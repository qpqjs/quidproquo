import fs from 'fs';
import os from 'os';
import path from 'path';
import { describe, expect, it } from 'vitest';

import { writeComposeFile } from './writeComposeFile';

const base = {
  imageName: '192.168.8.88:5000/qpq-qpqjs:local',
  serviceName: 'qpq-qpqjs',
  volumeName: 'qpq-qpqjs-data',
  portMappings: [
    { host: 80, container: 8080 },
    { host: 3090, container: 3090 },
  ],
  publicFileStoragePort: 3001,
};

describe('writeComposeFile', () => {
  it('uses a named volume and only the file storage port by default', () => {
    const contextDir = fs.mkdtempSync(path.join(os.tmpdir(), 'qpq-compose-'));

    const composePath = writeComposeFile({ ...base, contextDir, dataPath: null, publicHost: null });

    const compose = fs.readFileSync(composePath, 'utf8');
    expect(composePath).toBe(path.join(contextDir, 'docker-compose.yml'));
    expect(compose).toContain('image: 192.168.8.88:5000/qpq-qpqjs:local');
    expect(compose).toContain('      - "80:8080"\n      - "3090:3090"');
    expect(compose).toContain('- qpq-qpqjs-data:/app/.qpq-runtime');
    expect(compose).toContain('\nvolumes:\n  qpq-qpqjs-data:');
    expect(compose).toContain('environment:\n      - QPQ_PUBLIC_FILE_STORAGE_PORT=3001\n    ports:');
    expect(compose).not.toContain('QPQ_PUBLIC_HOST');
  });

  it('binds the data path and sets the public host when given', () => {
    const contextDir = fs.mkdtempSync(path.join(os.tmpdir(), 'qpq-compose-'));

    const compose = fs.readFileSync(
      writeComposeFile({ ...base, contextDir, dataPath: '/mnt/user/appdata/qpq-qpqjs', publicHost: '192.168.8.88', publicFileStoragePort: 3002 }),
      'utf8',
    );

    expect(compose).toContain('- /mnt/user/appdata/qpq-qpqjs:/app/.qpq-runtime');
    expect(compose).not.toContain('\nvolumes:\n  qpq-qpqjs-data:');
    expect(compose).toContain('environment:\n      - QPQ_PUBLIC_HOST=192.168.8.88\n      - QPQ_PUBLIC_FILE_STORAGE_PORT=3002');
  });
});
