import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { TaxCalculatorForm } from '@/components/tooling/tax-calculator-form';
import { hraTool, tdsTool } from '@/domain/registry';

describe('tax calculator form integration', () => {
  it('keeps an unreviewed HRA policy disabled without showing a policy record', async () => {
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
    await user.click(screen.getByRole('button', { name: 'Try an example' }));
    await user.click(screen.getByRole('button', { name: 'Calculate HRA exemption' }));
    expect((await screen.findAllByText(/No reviewed HRA policy/)).length).toBeGreaterThan(0);
    expect(screen.queryByText('Policy snapshot')).not.toBeInTheDocument();
  });

  it('does not bypass the review gate when switching regimes', async () => {
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
    await user.click(screen.getByRole('button', { name: 'Try an example' }));
    fireEvent.change(screen.getByRole('combobox', { name: /Tax regime/i }), { target: { value: 'new' } });
    await user.click(screen.getByRole('button', { name: 'Calculate HRA exemption' }));
    expect((await screen.findAllByText(/No reviewed HRA policy/)).length).toBeGreaterThan(0);
    expect(screen.queryByText('₹0.00')).not.toBeInTheDocument();
  });

  it('keeps a stale TDS policy disabled and validates residency', async () => {
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
    await user.click(screen.getByRole('button', { name: 'Try an example' }));
    await user.click(screen.getByRole('button', { name: 'Calculate estimate' }));
    expect((await screen.findAllByText(/review is due/iu)).length).toBeGreaterThan(0);
    fireEvent.change(screen.getByRole('combobox', { name: /Payee residency/i }), {
      target: { value: 'non-resident' },
    });
    await user.click(screen.getByRole('button', { name: 'Calculate estimate' }));
    expect((await screen.findAllByText(/Non-resident remittances/iu)).length).toBeGreaterThan(0);
  });
});
