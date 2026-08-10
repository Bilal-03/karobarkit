import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { AIAssistantForm } from '@/components/tooling/ai-assistant-form';
import { businessNameAssistantTool } from '@/domain/registry/tools/phase6';

describe('Phase 6 assistant form', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('requires consent and keeps export locked until the draft is reviewed', async () => {
    const user = userEvent.setup();
    vi.stubGlobal(
      'fetch',
      vi.fn(
        async () =>
          new Response(
            JSON.stringify({
              ok: true,
              result: {
                kind: 'business-name',
                title: 'A first shortlist',
                summary: 'Reviewable wording.',
                suggestions: ['Fresh Works'],
                sections: [{ heading: 'Next check', body: 'Check official registries.' }],
                metrics: [],
                warnings: ['No availability claim.'],
                promptVersion: 'business-name-v1.0',
                provider: 'deterministic-fallback',
                reviewRequired: true,
                redactedFields: [],
                transmittedFields: ['businessType'],
              },
            }),
            { status: 200, headers: { 'content-type': 'application/json' } },
          ),
      ),
    );

    render(
      <AIAssistantForm
        kind="business-name"
        tool={{
          id: businessNameAssistantTool.id,
          name: businessNameAssistantTool.name,
          category: businessNameAssistantTool.category,
          defaultValues: businessNameAssistantTool.defaultValues,
          privacyNote: businessNameAssistantTool.privacyNote,
        }}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Generate draft' }));
    expect(screen.getByText('Confirm the data-use notice before sending a request.')).toBeInTheDocument();

    await user.click(screen.getByLabelText(/I understand the disclosed fields/));
    await user.click(screen.getByRole('button', { name: 'Generate draft' }));
    await waitFor(() => expect(screen.getByText('A first shortlist')).toBeInTheDocument());
    expect(screen.getByRole('button', { name: 'Copy reviewed draft' })).toBeDisabled();

    await user.click(screen.getByLabelText(/I reviewed this draft/));
    expect(screen.getByRole('button', { name: 'Copy reviewed draft' })).toBeEnabled();
  });
});
