import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';

import { LoadingSpinner } from './LoadingSpinner';

describe('LoadingSpinner', () => {
  it('renders a progress indicator while loading', () => {
    render(
      <LoadingSpinner isLoading>
        <div>content</div>
      </LoadingSpinner>,
    );

    expect(screen.getByRole('progressbar')).toBeTruthy();
    expect(screen.queryByText('content')).toBeNull();
  });

  it('renders its children when not loading', () => {
    render(
      <LoadingSpinner isLoading={false}>
        <div>content</div>
      </LoadingSpinner>,
    );

    expect(screen.getByText('content')).toBeTruthy();
    expect(screen.queryByRole('progressbar')).toBeNull();
  });
});
