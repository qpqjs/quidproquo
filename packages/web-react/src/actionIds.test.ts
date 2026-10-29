import * as core from '@qpqjs/core';
import * as features from '@qpqjs/features';
import * as web from '@qpqjs/web';
import * as webserver from '@qpqjs/webserver';

import { describe, expect, it } from 'vitest';

// A2: `@quidproquo-<pkg>/<PascalDomain>/<PascalVerb>`, the enum member equals the last segment, and
// an id is minted once across the whole framework. The enums are discovered from each package's
// exports (an `<X>ActionType` export whose values are all `@quidproquo-` strings; config setting
// and effect enums share the prefix but are not action ids), so a new domain is checked the
// moment it is exported.
const ACTION_ID = /^@quidproquo-([a-z-]+)\/([A-Za-z]+)\/([A-Z][A-Za-z]*)$/;

// Stored identifiers (logs, admin search, messages between services) that predate the PascalDomain
// rule and stay as they are: renaming an id orphans every record that carries it.
const LOWER_CASE_DOMAINS = ['error', 'event', 'eventDoc', 'genericDataResource', 'mcp', 'mcpEventDocAi'];

type ActionTypeEnum = Record<string, string>;

const discoverEnums = (packageName: string, exports: Record<string, unknown>): [string, ActionTypeEnum][] =>
  Object.entries(exports)
    .filter((entry): entry is [string, ActionTypeEnum] => {
      const [name, value] = entry;
      if (!/ActionType(Enum)?$/.test(name) || !value || typeof value !== 'object') return false;
      const values = Object.values(value);
      return values.length > 0 && values.every((v) => typeof v === 'string' && v.startsWith('@quidproquo-'));
    })
    .map(([name, value]) => [`${packageName}.${name}`, value]);

const enums = [
  ...discoverEnums('core', core),
  ...discoverEnums('webserver', webserver),
  ...discoverEnums('web', web),
  ...discoverEnums('features', features),
];

describe('action ids', () => {
  it('finds the domain enums of every package', () => {
    expect(enums.length).toBeGreaterThan(30);
  });

  it.each(enums)('%s: every id is @quidproquo-<pkg>/<Domain>/<Verb> with the member named after the verb', (_name, actionType) => {
    for (const [member, id] of Object.entries(actionType)) {
      const match = ACTION_ID.exec(id);

      expect(match, `${member} = '${id}'`).not.toBeNull();
      expect(match![3], `${member} = '${id}'`).toBe(member);

      const domain = match![2];
      if (!LOWER_CASE_DOMAINS.includes(domain)) {
        expect(domain, `${member} = '${id}'`).toMatch(/^[A-Z]/);
      }
    }
  });

  it('mints every id once across the framework', () => {
    const ids = enums.flatMap(([, actionType]) => Object.values(actionType));
    const duplicates = ids.filter((id, index) => ids.indexOf(id) !== index);

    expect(duplicates).toEqual([]);
  });
});
