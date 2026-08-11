import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { TextUtilityForm } from '@/components/tooling/text-utility-form';
import { passwordToolkitTool, wordCharacterCounterTool } from '@/domain/registry';

describe('text utility form', () => {
  it('counts mixed Unicode text without sending the text to analytics', async () => {
    const user = userEvent.setup();
    render(<TextUtilityForm kind="word-counter" tool={wordCharacterCounterTool} />);

    await user.type(screen.getByRole('textbox', { name: 'Text' }), 'Hello दुनिया');

    expect(await screen.findByText('2')).toBeInTheDocument();
    expect(screen.getByText(/Text remains in the browser memory/)).toBeInTheDocument();
  });

  it('generates a local password without exposing a copy action', async () => {
    const user = userEvent.setup();
    render(<TextUtilityForm kind="password-toolkit" tool={passwordToolkitTool} />);

    await user.click(screen.getByRole('button', { name: 'Run locally' }));

    expect(await screen.findByText('Generated password')).toBeInTheDocument();
    expect(screen.getByText(/It is not copied or saved automatically/)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /copy/i })).not.toBeInTheDocument();
  });
});
