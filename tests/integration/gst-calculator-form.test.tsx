import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';

import { GstCalculatorForm } from '@/components/tooling/gst-calculator-form';
import { gstTool } from '@/domain/registry';
import {
  clearLocalScenarioTransfer,
  saveLocalScenarioTransfer,
} from '@/domain/workflows/local-scenario-transfer';

afterEach(() => clearLocalScenarioTransfer());

describe('GST calculator form integration', () => {
  it('calculates the exclusive default and announces the result', async () => {
    const user = userEvent.setup();
    render(<GstCalculatorForm tool={gstTool} />);

    await user.click(screen.getByRole('button', { name: 'Calculate GST' }));

    expect(await screen.findAllByText('₹180.00')).toHaveLength(2);
    expect(screen.getByText('₹1,180.00')).toBeInTheDocument();
    expect(screen.getByText('gst-general-rates-2025-09-22-v1')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Notification No\. 09\/2025/ }).getAttribute('href')).toMatch(
      /taxinformation\.cbic\.gov\.in/,
    );
  });

  it('supports inclusive mode, intra-state split and custom rates', async () => {
    const user = userEvent.setup();
    render(<GstCalculatorForm tool={gstTool} />);

    await user.clear(screen.getByRole('textbox', { name: 'Amount' }));
    await user.type(screen.getByRole('textbox', { name: 'Amount' }), '1180');
    await user.click(screen.getByRole('radio', { name: 'GST inclusive' }));
    await user.click(screen.getByRole('radio', { name: 'Intra-state · CGST + SGST/UTGST' }));
    await user.click(screen.getByRole('button', { name: 'Calculate GST' }));

    expect(await screen.findByText('₹1,000.00')).toBeInTheDocument();
    expect(screen.getAllByText('₹90.00')).toHaveLength(2);

    await user.click(screen.getByRole('radio', { name: 'Custom rate · not policy-verified' }));
    await user.clear(screen.getByRole('textbox', { name: 'Custom GST rate (%)' }));
    await user.type(screen.getByRole('textbox', { name: 'Custom GST rate (%)' }), '5.5');
    await user.click(screen.getByRole('button', { name: 'Calculate GST' }));

    expect(await screen.findByText('Custom-rate warning')).toBeInTheDocument();
    expect(screen.getByText('5.50% · Custom rate · user supplied')).toBeInTheDocument();
  });

  it('announces validation errors and resets values and results', async () => {
    const user = userEvent.setup();
    render(<GstCalculatorForm tool={gstTool} />);

    const amount = screen.getByRole('textbox', { name: 'Amount' });
    await user.clear(amount);
    await user.type(amount, '0');
    await user.click(screen.getByRole('button', { name: 'Calculate GST' }));

    const summary = await screen.findByRole('alert', { name: 'Check the highlighted fields' });
    await waitFor(() => expect(summary).toHaveFocus());
    expect(amount).toHaveAttribute('aria-invalid', 'true');

    await user.click(screen.getByRole('button', { name: 'Reset form' }));
    expect(amount).toHaveValue('1000');
    expect(screen.queryByText('Amount must be greater than zero.')).not.toBeInTheDocument();
  });

  it('requires an explicit import before using a discounted final price', async () => {
    saveLocalScenarioTransfer({
      sourceToolId: 'discount-calculator',
      sourceToolName: 'Discount Calculator',
      sourceKind: 'discount-to-gst',
      values: { amount: '855' },
    });
    const user = userEvent.setup();
    render(<GstCalculatorForm tool={gstTool} />);

    expect(await screen.findByText(/final price is ready from Discount Calculator/i)).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'Amount' })).toHaveValue('1000');
    await user.click(screen.getByRole('button', { name: 'Import final price' }));
    expect(screen.getByRole('textbox', { name: 'Amount' })).toHaveValue('855');
  });
});
