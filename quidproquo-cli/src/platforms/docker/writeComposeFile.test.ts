import fs from 'fs';
import os from 'os';
import path from 'path';
import { describe, expect, it } from 'vitest';

import { writeComposeFile } from './writeComposeFile';

describe('writeComposeFile', () => {
  it('writes the image, ports and state volume', () => {
    const contextDir = fs.mkdtempSync(path.join(os.tmpdir(), 'qpq-compose-'));

    const composePath = writeComposeFile({
      contextDir,
      imageName: '192.168.8.88:5000/qpq-qpqjs:local',
      serviceName: 'qpq-qpqjs',
      volumeName: 'qpq-qpqjs-data',
      portMappings: [
        { host: 80, container: 8080 },
        { host: 3090, container: 3090 },
      ],
    });

    const compose = fs.readFileSync(composePath, 'utf8');
    expect(composePath).toBe(path.join(contextDir, 'docker-compose.yml'));
    expect(compose).toContain('image: 192.168.8.88:5000/qpq-qpqjs:local');
    expect(compose).toContain('      - "80:8080"\n      - "3090:3090"');
    expect(compose).toContain('- qpq-qpqjs-data:/app/.qpq-runtime');
    expect(compose).toContain('volumes:\n  qpq-qpqjs-data:');
  });
});
