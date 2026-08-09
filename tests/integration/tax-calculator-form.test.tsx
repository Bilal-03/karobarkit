import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { TaxCalculatorForm } from '@/components/tooling/tax-calculator-form';
import { hraTool, tdsTool } from '@/domain/registry';

describe('tax calculator form integration', () => {
  it('renders the HRA policy result and explicit review boundary', async () => {
    const user = userEvent.setup();
    render(
      <TaxCalculatorForm
        kind="hra"
        tool={{
          id: hraTool.id,
          name: hraTool.name,
          category: hraTool.category,
          defaultValues: hraTool.defaultValues,
          privacyNote: hraTool.privacyNote,
        }}
      />,
    );
    await user.click(screen.getByRole('button', { name: 'Calculate HRA exemption' }));
    expect(await screen.findByRole('heading', { name: 'HRA exemption illustration' })).toBeInTheDocument();
    expect(screen.getAllByText('₹1,20,000.00')).not.toHaveLength(0);
    expect(screen.getByText(/one stable rented-accommodation period/iu)).toBeInTheDocument();
  });

  it('shows a new-regime boundary instead of a positive exemption', async () => {
    const user = userEvent.setup();
    render(
      <TaxCalculatorForm
        kind="hra"
        tool={{
          id: hraTool.id,
          name: hraTool.name,
          category: hraTool.category,
          defaultValues: hraTool.defaultValues,
          privacyNote: hraTool.privacyNote,
        }}
      />,
    );
    fireEvent.change(screen.getByLabelText(/Tax regime/i), { target: { value: 'new' } });
    await user.click(screen.getByRole('button', { name: 'Calculate HRA exemption' }));
    expect(await screen.findByText('₹0.00')).toBeInTheDocument();
    expect(screen.getByText(/not available in the new tax regime/iu)).toBeInTheDocument();
  });

  it('renders a TDS policy snapshot and stops in the form layer on invalid residency', async () => {
    const user = userEvent.setup();
    render(
      <TaxCalculatorForm
        kind="tds"
        tool={{
          id: tdsTool.id,
          name: tdsTool.name,
          category: tdsTool.category,
          defaultValues: tdsTool.defaultValues,
          privacyNote: tdsTool.privacyNote,
        }}
      />,
    );
    await user.click(screen.getByRole('button', { name: 'Calculate estimate' }));
    expect((await screen.findAllByText(/Income Tax Act, 2025/iu)).length).toBeGreaterThan(0);
    fireEvent.change(screen.getByLabelText(/Payee residency/i), { target: { value: 'non-resident' } });
    await user.click(screen.getByRole('button', { name: 'Calculate estimate' }));
    expect((await screen.findAllByText(/Non-resident remittances/iu)).length).toBeGreaterThan(0);
  });
});
