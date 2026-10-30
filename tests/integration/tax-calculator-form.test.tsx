import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { TaxCalculatorForm } from '@/components/tooling/tax-calculator-form';
import { hraTool, tdsTool, incomeTaxTool } from '@/domain/registry';

describe('tax calculator form integration', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2027-10-31T12:00:00Z'));
  });
  afterEach(() => vi.useRealTimers());

  it('explains the full tax total including cess and tax credits', async () => {
    const user = userEvent.setup();
    render(<TaxCalculatorForm kind="income-tax" tool={incomeTaxTool} />);
    await user.click(screen.getByRole('button', { name: 'Try an example' }));
    fireEvent.change(document.getElementById('salaryIncome')!, { target: { value: '1800000' } });
    await user.click(screen.getByRole('button', { name: 'Calculate estimate' }));
    expect(await screen.findByText('Health and education cess')).toBeInTheDocument();
    expect(screen.getByText('₹6,400.00')).toBeInTheDocument();
    expect(screen.getByText('₹1,66,400.00', { selector: '.result-panel__value' })).toBeInTheDocument();
    expect(screen.getByText('Estimated balance after credit')).toBeInTheDocument();
  });

  it('calculates HRA using bundled rules after the review date', async () => {
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
    expect((await screen.findAllByText('₹1,20,000.00')).length).toBeGreaterThan(0);
    expect(screen.getByText(/This project estimate uses bundled rules/)).toBeInTheDocument();
  });

  it('calculates the zero exemption when switching to the new regime', async () => {
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
    expect((await screen.findAllByText('₹0.00')).length).toBeGreaterThan(0);
  });

  it('calculates with an overdue TDS review and still validates residency', async () => {
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
    expect(await screen.findByText(/This project estimate uses bundled rules/)).toBeInTheDocument();
    fireEvent.change(screen.getByRole('combobox', { name: /Payee residency/i }), {
      target: { value: 'non-resident' },
    });
    await user.click(screen.getByRole('button', { name: 'Calculate estimate' }));
    expect((await screen.findAllByText(/Non-resident remittances/iu)).length).toBeGreaterThan(0);
  });
});
