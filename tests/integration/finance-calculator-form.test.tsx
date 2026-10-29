import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { FinanceCalculatorForm } from '@/components/tooling/finance-calculator-form';
import { emiTool, xirrTool } from '@/domain/registry';

describe('finance calculator form integration', () => {
  it('renders a local EMI scenario with an amortization preview', async () => {
    const user = userEvent.setup();
    render(<FinanceCalculatorForm kind="emi" tool={emiTool} />);
    const example = screen.queryByRole('button', { name: 'Try an example' });
    if (example) await user.click(example);

    await user.click(screen.getByRole('button', { name: 'Calculate scenario' }));

    expect((await screen.findAllByText('₹21,247.04'))[0]).toBeInTheDocument();
    expect(screen.getByText(/Repayment schedule/)).toBeInTheDocument();
    expect(screen.queryByText(/Rates and returns are user-entered assumptions/)).not.toBeInTheDocument();
  });

  it('shows XIRR format errors before attempting to show a result', async () => {
    const user = userEvent.setup();
    render(<FinanceCalculatorForm kind="xirr" tool={xirrTool} />);
    const example = screen.queryByRole('button', { name: 'Try an example' });
    if (example) await user.click(example);

    const cashFlows = screen.getByRole('textbox', { name: /Dated cash flows/ });
    await user.clear(cashFlows);
    await user.type(cashFlows, '2024-01-01,100000\n2025-01-01,110000');
    await user.click(screen.getByRole('button', { name: 'Calculate scenario' }));

    expect(
      await screen.findByText(/Include at least one negative investment/, { selector: '#cashFlows-error' }),
    ).toBeInTheDocument();
    expect(screen.queryByText('A transparent finance view')).not.toBeInTheDocument();
  });
});
