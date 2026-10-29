import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';
import { GstCalculatorForm } from '@/components/tooling/gst-calculator-form';
import { gstTool } from '@/domain/registry';
import {
  clearLocalScenarioTransfer,
  saveLocalScenarioTransfer,
} from '@/domain/workflows/local-scenario-transfer';
afterEach(() => clearLocalScenarioTransfer());
describe('focused GST workspace', () => {
  it('starts empty and calculates an explicit example without reference sections', async () => {
    render(<GstCalculatorForm tool={gstTool} />);
    expect(screen.getByRole('textbox', { name: /^Amount/ })).toHaveValue('');
    fireEvent.click(screen.getByRole('button', { name: 'Try an example' }));
    expect(await screen.findByText('₹1,180.00')).toBeInTheDocument();
    expect(screen.getByText('₹180.00')).toBeInTheDocument();
    expect(screen.queryByText(/Supporting official sources/)).not.toBeInTheDocument();
  });
  it('supports remove GST, optional splitting and a custom rate', async () => {
    const user = userEvent.setup();
    render(<GstCalculatorForm tool={gstTool} />);
    fireEvent.change(screen.getByRole('textbox', { name: /^Amount/ }), { target: { value: '1180' } });
    await user.click(screen.getByRole('radio', { name: 'Remove GST' }));
    await user.click(screen.getByText('Split tax components'));
    await user.click(screen.getByRole('radio', { name: 'Within state' }));
    expect(await screen.findByText('₹1,000.00')).toBeInTheDocument();
    await user.click(screen.getByText('Tax components', { exact: true }));
    expect(screen.getAllByText('₹90.00')).toHaveLength(2);
    await user.click(screen.getByRole('radio', { name: 'Custom' }));
    fireEvent.change(screen.getByRole('textbox', { name: 'Custom rate (%)' }), { target: { value: '5.5' } });
    expect(await screen.findByText('₹61.52')).toBeInTheDocument();
    expect(screen.getByText(/Use a rate you have verified/)).toBeInTheDocument();
  });
  it('announces invalid inputs and clears to an empty state', async () => {
    const user = userEvent.setup();
    render(<GstCalculatorForm tool={gstTool} />);
    const input = screen.getByRole('textbox', { name: /^Amount/ });
    fireEvent.change(input, { target: { value: '0' } });
    await user.click(screen.getByRole('button', { name: 'Calculate GST' }));
    const summary = await screen.findByRole('alert', { name: 'Check the highlighted fields' });
    await waitFor(() => expect(summary).toHaveFocus());
    expect(input).toHaveAttribute('aria-invalid', 'true');
    await user.click(screen.getByRole('button', { name: 'Clear' }));
    expect(input).toHaveValue('');
    expect(screen.queryByText('Amount must be greater than zero.')).not.toBeInTheDocument();
  });
  it('imports a discount result only after an explicit action', async () => {
    saveLocalScenarioTransfer({
      sourceToolId: 'discount-calculator',
      sourceToolName: 'Discount Calculator',
      sourceKind: 'discount-to-gst',
      values: { amount: '855' },
    });
    render(<GstCalculatorForm tool={gstTool} />);
    expect(await screen.findByText(/Use the amount from your discount calculation/)).toBeInTheDocument();
    const input = screen.getByRole('textbox', { name: /^Amount/ });
    expect(input).toHaveValue('');
    fireEvent.click(screen.getByRole('button', { name: 'Import amount' }));
    expect(input).toHaveValue('855');
  });
});
