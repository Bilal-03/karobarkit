import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import {
  INITIAL_VISIBLE_TOOLS,
  LiveToolSearch,
  parseDirectorySearchParams,
  VISIBLE_TOOL_INCREMENT,
} from '@/components/search/live-tool-search';
import { toolDiscoveryIndex } from '@/domain/registry';

describe('directory search scaling', () => {
  it('parses URL-backed directory filters and ignores unsupported values', () => {
    expect(
      parseDirectorySearchParams(
        new URLSearchParams(
          'q=gst%20bill&category=gst-tax&type=calculator&execution=local&regulated=regulated',
        ),
      ),
    ).toEqual({
      query: 'gst bill',
      category: 'gst-tax',
      kind: 'calculator',
      execution: 'local',
      regulated: 'regulated',
    });
    expect(
      parseDirectorySearchParams(
        new URLSearchParams('category=not-a-category&type=unknown&execution=remote&regulated=maybe'),
      ),
    ).toEqual({
      query: '',
      category: 'all',
      kind: 'all',
      execution: 'all',
      regulated: 'all',
    });
  });

  it('caps the initial result window and resets it when the query changes', async () => {
    const user = userEvent.setup();
    const totalTools = toolDiscoveryIndex.length;
    const expandedTools = Math.min(INITIAL_VISIBLE_TOOLS + VISIBLE_TOOL_INCREMENT, totalTools);
    render(<LiveToolSearch id="directory-search" tools={toolDiscoveryIndex} variant="page" />);

    expect(screen.getByText(`Showing ${INITIAL_VISIBLE_TOOLS} of ${totalTools} tools`)).toHaveAttribute(
      'aria-live',
      'polite',
    );
    expect(document.querySelectorAll('.tool-card')).toHaveLength(INITIAL_VISIBLE_TOOLS);

    await user.click(screen.getByRole('button', { name: 'Show more tools' }));
    expect(screen.getByText(`Showing ${expandedTools} of ${totalTools} tools`)).toBeInTheDocument();
    expect(document.querySelectorAll('.tool-card')).toHaveLength(expandedTools);

    const input = screen.getByRole('searchbox', { name: 'Search tools' });
    await user.type(input, 'gst');
    await user.clear(input);

    expect(screen.getByText(`Showing ${INITIAL_VISIBLE_TOOLS} of ${totalTools} tools`)).toBeInTheDocument();
    expect(document.querySelectorAll('.tool-card')).toHaveLength(INITIAL_VISIBLE_TOOLS);
  });
});
