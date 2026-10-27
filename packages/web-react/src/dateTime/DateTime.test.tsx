import { createElement } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render } from '@testing-library/react';

import { DateTime } from './DateTime';

const isoDateTime = '2026-06-26T11:55:00.000Z';

describe('DateTime', () => {
  beforeEach(() => vi.useFakeTimers().setSystemTime(new Date('2026-06-26T12:00:00.000Z')));
  afterEach(() => vi.useRealTimers());

  it('renders the relative time alongside the absolute time', () => {
    const { container } = render(createElement(DateTime, { isoDateTime, locale: 'en' }));

    expect(container.querySelector('time')?.getAttribute('dateTime')).toBe(new Date(isoDateTime).toISOString());
    expect(container.textContent).toContain('5 minutes ago');
  });

  it('renders the placeholder for an invalid date', () => {
    const { container } = render(createElement(DateTime, { isoDateTime: '', placeholder: 'n/a' }));

    expect(container.textContent).toBe('n/a');
  });

  it('hides the time-ago label when hideTimeAgo is set', () => {
    const { container } = render(createElement(DateTime, { isoDateTime, locale: 'en', hideTimeAgo: true }));

    expect(container.textContent).not.toContain('ago');
  });

  it('renders inline with the relative time in parentheses', () => {
    const { container } = render(createElement(DateTime, { isoDateTime, locale: 'en', isMultiline: false }));

    expect(container.textContent).toContain('(5 minutes ago)');
  });

  it('accepts a unix timestamp input', () => {
    const ms = new Date(isoDateTime).getTime();
    const { container } = render(createElement(DateTime, { unixTimestampMs: ms, locale: 'en' }));

    expect(container.querySelector('time')?.getAttribute('dateTime')).toBe(new Date(ms).toISOString());
  });

  it('accepts a Date input and honors date/time visibility flags', () => {
    const { container } = render(createElement(DateTime, { date: new Date(isoDateTime), locale: 'en', hideDate: true, hideTimeAgo: true }));

    const text = container.textContent ?? '';
    expect(text).not.toContain('26');
    expect(text.length).toBeGreaterThan(0);
  });
});
