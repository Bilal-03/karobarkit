import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { DocumentGeneratorForm } from '@/components/documents/document-generator-form';
import { letterheadTool, paymentReceiptTool } from '@/domain/registry';

vi.setConfig({ testTimeout: 15000 });

describe('document generator form integration', () => {
  it('creates a minimum letterhead and preserves plain text as text', async () => {
    const user = userEvent.setup();
    render(<DocumentGeneratorForm kind="letterhead" tool={letterheadTool} />);

    await user.type(screen.getByRole('textbox', { name: 'Business name' }), 'नमस्ते Studio');
    await user.type(screen.getByRole('textbox', { name: 'Business address' }), 'Market Road\nPune');
    await user.type(screen.getByRole('textbox', { name: 'Letter body (optional)' }), '<script>no</script>');
    await user.click(screen.getByRole('button', { name: 'Create letterhead' }));

    expect(await screen.findByTestId('document-preview')).toBeInTheDocument();
    expect(screen.getByText('नमस्ते Studio')).toBeInTheDocument();
    expect(screen.getAllByText('<script>no</script>')).toHaveLength(2);
    expect(screen.queryByRole('script')).not.toBeInTheDocument();
    expect(screen.getAllByTestId('a4-page')).toHaveLength(1);
  });

  it('supports template switching and long letter pagination', async () => {
    const user = userEvent.setup();
    render(<DocumentGeneratorForm kind="letterhead" tool={letterheadTool} />);

    await user.type(screen.getByRole('textbox', { name: 'Business name' }), 'Long Letter Co');
    await user.type(screen.getByRole('textbox', { name: 'Business address' }), 'A long address');
    await user.selectOptions(screen.getByRole('combobox', { name: 'Layout' }), 'formal');
    fireEvent.change(screen.getByRole('textbox', { name: 'Letter body (optional)' }), {
      target: { value: 'A '.repeat(1800) },
    });
    await user.click(screen.getByRole('button', { name: 'Create letterhead' }));

    expect(await screen.findByTestId('document-preview')).toHaveClass('document-preview');
    expect(screen.getAllByTestId('a4-page').length).toBeGreaterThan(1);
    expect(screen.getAllByTestId('a4-page')[0]).toHaveClass('a4-page--formal');
  });

  it('creates a receipt with amount in words and exposes the settlement disclaimer', async () => {
    const user = userEvent.setup();
    render(<DocumentGeneratorForm kind="payment-receipt" tool={paymentReceiptTool} />);

    await user.type(screen.getByRole('textbox', { name: 'Business name' }), 'Ravi & Sons');
    await user.type(screen.getByRole('textbox', { name: 'Business address' }), 'Market Road');
    await user.type(screen.getByRole('textbox', { name: 'Receipt number' }), 'RCPT/001');
    fireEvent.change(screen.getByLabelText(/Receipt date/), { target: { value: '2026-08-06' } });
    await user.type(screen.getByRole('textbox', { name: 'Received from' }), 'Nikhil');
    await user.type(screen.getByRole('textbox', { name: 'Amount received' }), '1250.50');
    await user.type(screen.getByRole('textbox', { name: 'Payment purpose' }), 'Consulting retainer');
    await user.click(screen.getByRole('button', { name: 'Create receipt' }));

    expect(
      await screen.findByText('One Thousand Two Hundred Fifty Rupees and Fifty Paise Only'),
    ).toBeInTheDocument();
    expect(screen.getByText(/not bank confirmation, proof of settlement/iu)).toBeInTheDocument();
  });

  it('announces invalid receipt amounts and focuses the error summary', async () => {
    const user = userEvent.setup();
    render(<DocumentGeneratorForm kind="payment-receipt" tool={paymentReceiptTool} />);

    await user.type(screen.getByRole('textbox', { name: 'Business name' }), 'Ravi & Sons');
    await user.type(screen.getByRole('textbox', { name: 'Business address' }), 'Market Road');
    await user.type(screen.getByRole('textbox', { name: 'Receipt number' }), 'RCPT/001');
    fireEvent.change(screen.getByLabelText(/Receipt date/), { target: { value: '2026-08-06' } });
    await user.type(screen.getByRole('textbox', { name: 'Received from' }), 'Nikhil');
    await user.type(screen.getByRole('textbox', { name: 'Amount received' }), '-1');
    await user.type(screen.getByRole('textbox', { name: 'Payment purpose' }), 'Consulting');
    await user.click(screen.getByRole('button', { name: 'Create receipt' }));

    const summary = await screen.findByRole('alert', { name: 'Check the highlighted fields' });
    await waitFor(() => expect(summary).toHaveFocus());
    expect(screen.getByRole('textbox', { name: 'Amount received' })).toHaveAttribute('aria-invalid', 'true');
    expect(summary).toHaveTextContent('Amount must be greater than zero');
  });

  it('resets a generated document after confirmation', async () => {
    const user = userEvent.setup();
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    render(<DocumentGeneratorForm kind="letterhead" tool={letterheadTool} />);

    await user.type(screen.getByRole('textbox', { name: 'Business name' }), 'Reset Co');
    await user.type(screen.getByRole('textbox', { name: 'Business address' }), 'Address');
    await user.click(screen.getByRole('button', { name: 'Create letterhead' }));
    await screen.findByTestId('document-preview');
    await user.click(screen.getByRole('button', { name: 'Reset' }));

    expect(screen.getByRole('textbox', { name: 'Business name' })).toHaveValue('');
    expect(screen.queryByTestId('document-preview')).not.toBeInTheDocument();
  });
});
