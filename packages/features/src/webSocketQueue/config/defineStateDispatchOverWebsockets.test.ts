import { QPQCoreConfigSettingType } from 'quidproquo-core';

import { describe, expect, it } from 'vitest';

import { defineStateDispatchOverWebsockets } from './defineStateDispatchOverWebsockets';

describe('defineStateDispatchOverWebsockets', () => {
  it('registers a single action processors setting', () => {
    const config = defineStateDispatchOverWebsockets();

    expect(config).toHaveLength(1);
    expect(config[0]).toMatchObject({ configSettingType: QPQCoreConfigSettingType.actionProcessors });
  });
});
