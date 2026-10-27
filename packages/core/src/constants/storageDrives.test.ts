import { describe, expect, it } from 'vitest';

import { QPQ_LOG_REPORTS_STORAGE_DRIVE_NAME, QPQ_LOGS_STORAGE_DRIVE_NAME } from './storageDrives';

// These names are referenced by resource name from deployed services and
// Lambda runtime code. The source file says NEVER EVER CHANGE THIS NAME;
// these tests exist to make a rename fail loudly instead of silently
// breaking log routing.
describe('storage drive names', () => {
  it('locks the qpq logs drive name', () => {
    expect(QPQ_LOGS_STORAGE_DRIVE_NAME).toBe('qpq-logs');
  });

  it('locks the qpq log reports drive name', () => {
    expect(QPQ_LOG_REPORTS_STORAGE_DRIVE_NAME).toBe('qpq-log-reports');
  });
});
