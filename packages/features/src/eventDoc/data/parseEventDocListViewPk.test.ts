import { describe, expect, it } from 'vitest';

import { eventDocListViewPk } from './eventDocListViewPk';
import { parseEventDocListViewPk } from './parseEventDocListViewPk';

describe('parseEventDocListViewPk', () => {
  it('takes a key apart into the view and type it was built from', () => {
    expect(parseEventDocListViewPk(eventDocListViewPk('overview', 'envelope'))).toEqual({ viewName: 'overview', type: 'envelope' });
  });

  it('answers null for anything that is not one view name and one type', () => {
    expect(parseEventDocListViewPk('envelope')).toBeNull();
    expect(parseEventDocListViewPk('#envelope')).toBeNull();
    expect(parseEventDocListViewPk('a#b#c')).toBeNull();
  });
});
