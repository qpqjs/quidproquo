import { describe, expect, it } from 'vitest';

import { AdminSettingDataType, AdminSettingFieldType } from './WebSocketQueueQpqAdminServerEventMessageModifySetting';

describe('AdminSettingFieldType', () => {
  it('names each settings field type', () => {
    expect(AdminSettingFieldType).toEqual({
      TextBox: 'TextBox',
      CheckBox: 'CheckBox',
    });
  });
});

describe('AdminSettingDataType', () => {
  it('names each settings data type', () => {
    expect(AdminSettingDataType).toEqual({
      Parameter: 'Parameter',
    });
  });
});
