import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { CalculatorForm } from '@/components/tooling/calculator-form';
import { cagrTool, roiTool } from '@/domain/registry';

describe('calculator form integration', () => {
  it('shows the seeded ROI result immediately and updates it while typing', async () => {
    const user = userEvent.setup();
    render(<CalculatorForm kind="roi" tool={roiTool} />);

    expect(await screen.findByText('25.00%')).toBeInTheDocument();

    const finalValue = screen.getByRole('textbox', { name: /Final value/ });
    await user.clear(finalValue);
    await user.type(finalValue, '150000');

    expect(await screen.findByText('50.00%')).toBeInTheDocument();
    expect(screen.getByText('₹50,000.00')).toBeInTheDocument();
  });

  it('shows linked validation errors and preserves the entered values', async () => {
    const user = userEvent.setup();
    render(<CalculatorForm kind="cagr" tool={cagrTool} />);

    const beginning = screen.getByRole('textbox', { name: /Beginning value/ });
    await user.clear(beginning);
    await user.type(beginning, '0');
    await user.click(screen.getByRole('button', { name: 'Calculate result' }));

    await waitFor(() =>
      expect(document.getElementById('beginningValue-error')).toHaveTextContent(
        'Beginning value must be greater than zero for CAGR.',
      ),
    );
    expect(beginning).toHaveValue('0');
    expect(screen.getAllByRole('alert').length).toBeGreaterThanOrEqual(2);
  });

  it('renders a long-horizon negative CAGR without crashing the page', async () => {
    const user = userEvent.setup();
    render(<CalculatorForm kind="cagr" tool={cagrTool} />);

    await user.clear(screen.getByRole('textbox', { name: /Beginning value/ }));
    await user.type(screen.getByRole('textbox', { name: /Beginning value/ }), '100000');
    await user.clear(screen.getByRole('textbox', { name: /Ending value/ }));
    await user.type(screen.getByRole('textbox', { name: /Ending value/ }), '16105');
    await user.clear(screen.getByRole('textbox', { name: /Duration in years/ }));
    await user.type(screen.getByRole('textbox', { name: /Duration in years/ }), '50');
    await user.click(screen.getByRole('button', { name: 'Calculate result' }));

    expect(await screen.findByText('-3.59%')).toBeInTheDocument();
    expect(screen.getByText('Smoothed annual change across the period.')).toBeInTheDocument();
  });

  it('renders the ROI result after a valid submission', async () => {
    const user = userEvent.setup();
    render(<CalculatorForm kind="roi" tool={roiTool} />);

    await user.click(screen.getByRole('button', { name: 'Calculate result' }));

    expect(await screen.findByText('25.00%')).toBeInTheDocument();
    expect(screen.getByText('₹25,000.00')).toBeInTheDocument();
  });

  it('clears stale results and focuses the announced error summary after invalid edits', async () => {
    const user = userEvent.setup();
    render(<CalculatorForm kind="roi" tool={roiTool} />);

    await user.click(screen.getByRole('button', { name: 'Calculate result' }));
    expect(await screen.findByText('25.00%')).toBeInTheDocument();

    const cost = screen.getByRole('textbox', { name: /Investment cost/ });
    await user.clear(cost);
    await user.type(cost, '0');
    await user.click(screen.getByRole('button', { name: 'Calculate result' }));

    const summary = await screen.findByRole('alert', { name: 'Check the highlighted fields' });
    await waitFor(() => expect(summary).toHaveFocus());
    expect(screen.queryByText('25.00%')).not.toBeInTheDocument();
    expect(cost).toHaveAttribute('aria-invalid', 'true');
    expect(cost).toHaveAttribute('aria-describedby', expect.stringContaining('investmentCost-error'));
  });
});
