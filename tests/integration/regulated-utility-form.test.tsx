import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { RegulatedUtilityForm } from '@/components/tooling/regulated-utility-form';
import { depreciationTool, hsnSacFinderTool } from '@/domain/registry';

describe('regulated utility form', () => {
  it('keeps HSN search local, interactive and explicitly classified as reference-only', async () => {
    const user = userEvent.setup();
    render(<RegulatedUtilityForm kind="hsn-sac" tool={hsnSacFinderTool} />);

    const form = screen.getByRole('textbox', { name: 'Code or keyword' }).closest('form');
    await waitFor(() => expect(form).toHaveAttribute('data-interactive', 'true'));
    await user.type(screen.getByRole('textbox', { name: 'Code or keyword' }), 'bread');
    await user.click(screen.getByRole('button', { name: 'Calculate reference result' }));

    expect(await screen.findByText(/1905/)).toBeInTheDocument();
    expect(screen.getByText(/Reference search only/)).toBeInTheDocument();
    expect(screen.getAllByText(/Inputs and bundled policy data stay in this browser/).length).toBe(2);
  });

  it('switches depreciation modes without changing the page shell', async () => {
    const user = userEvent.setup();
    render(<RegulatedUtilityForm kind="depreciation" tool={depreciationTool} />);

    await user.click(screen.getByRole('button', { name: 'Calculate reference result' }));
    expect(await screen.findByText(/Illustrative depreciation/)).toBeInTheDocument();
    expect(screen.getByText(/Companies Act \/ SLM/)).toBeInTheDocument();

    await user.selectOptions(screen.getByRole('combobox', { name: 'Policy mode' }), 'income-tax');
    expect(screen.getByRole('combobox', { name: 'Method' })).toHaveValue('wdv');
    expect(screen.getByText(/The modes stay separate/)).toBeInTheDocument();
  });
});
