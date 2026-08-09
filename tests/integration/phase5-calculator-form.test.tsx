import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { Phase5CalculatorForm } from '@/components/tooling/phase5-calculator-form';
import { amazonFeesTool, cacTool } from '@/domain/registry';

describe('Phase 5 calculator form integration', () => {
  it('renders a CAC result with the attribution boundary and CSV action', async () => {
    const user = userEvent.setup();
    render(<Phase5CalculatorForm kind="cac" tool={cacTool} />);

    await user.click(screen.getByRole('button', { name: 'Calculate scenario' }));

    expect((await screen.findAllByText('₹5,000.00')).length).toBeGreaterThan(0);
    expect(screen.getByText(/same declared window/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Download CSV' })).toBeInTheDocument();
  });

  it('keeps unsupported Amazon Self-Ship policy assumptions blocked', async () => {
    const user = userEvent.setup();
    render(<Phase5CalculatorForm kind="amazon-fees" tool={amazonFeesTool} />);

    await user.selectOptions(screen.getByRole('combobox', { name: /Fulfilment channel/ }), 'self-ship');
    await user.type(screen.getByRole('textbox', { name: /Weight-handling \/ shipping fee/ }), '0');
    await user.click(screen.getByRole('button', { name: 'Calculate scenario' }));

    expect(
      await screen.findByText(/selected Amazon category\/channel\/price band has no bundled rate/, {
        selector: '#closingFeeOverride-error',
      }),
    ).toBeInTheDocument();
    expect(screen.queryByText('A transparent Phase 5 view')).not.toBeInTheDocument();
  });
});
