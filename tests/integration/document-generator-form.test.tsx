import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { DocumentGeneratorForm } from '@/components/documents/document-generator-form';
import { letterheadTool, paymentReceiptTool } from '@/domain/registry';

vi.setConfig({ testTimeout: 30000 });

describe('document generator form integration', () => {
  it('creates a minimum letterhead and preserves plain text as text', async () => {
    const user = userEvent.setup();
    render(<DocumentGeneratorForm kind="letterhead" tool={letterheadTool} />);

    fireEvent.change(screen.getByRole('textbox', { name: 'Business name' }), {
      target: { value: 'नमस्ते Studio' },
    });
    fireEvent.change(screen.getByRole('textbox', { name: 'Business address' }), {
      target: { value: 'Market Road\nPune' },
    });
    fireEvent.change(screen.getByRole('textbox', { name: 'Letter body (optional)' }), {
      target: { value: '<script>no</script>' },
    });
    if (screen.queryByRole('button', { name: 'Next' })) {
      await user.click(screen.getByRole('button', { name: 'Next' }));
    }
    await user.click(screen.getByRole('button', { name: 'Review document' }));

    expect(await screen.findByTestId('document-preview')).toBeInTheDocument();
    expect(screen.getByTestId('document-preview')).toHaveTextContent('नमस्ते Studio');
    expect(screen.getByTestId('document-preview').querySelector('script')).toBeNull();
    expect(screen.queryByRole('script')).not.toBeInTheDocument();
    expect(screen.getAllByTestId('a4-page')).toHaveLength(1);
  });

  it('supports template switching and long letter pagination', async () => {
    const user = userEvent.setup();
    render(<DocumentGeneratorForm kind="letterhead" tool={letterheadTool} />);

    fireEvent.change(screen.getByRole('textbox', { name: 'Business name' }), {
      target: { value: 'Long Letter Co' },
    });
    fireEvent.change(screen.getByRole('textbox', { name: 'Business address' }), {
      target: { value: 'A long address' },
    });
    await user.click(screen.getByRole('button', { name: 'Next' }));
    await user.selectOptions(screen.getByRole('combobox', { name: 'Layout' }), 'formal');
    fireEvent.click(document.querySelector('.document-steps button')!);
    fireEvent.change(screen.getByRole('textbox', { name: 'Letter body (optional)' }), {
      target: { value: 'A '.repeat(1800) },
    });
    if (screen.queryByRole('button', { name: 'Next' })) {
      await user.click(screen.getByRole('button', { name: 'Next' }));
    }
    await user.click(screen.getByRole('button', { name: 'Review document' }));

    expect(await screen.findByTestId('document-preview')).toHaveClass('document-preview');
    expect(screen.getAllByTestId('a4-page').length).toBeGreaterThan(1);
    expect(screen.getAllByTestId('a4-page')[0]).toHaveClass('a4-page--formal');
  });

  it('creates a receipt with amount in words and exposes the settlement disclaimer', async () => {
    const user = userEvent.setup();
    render(<DocumentGeneratorForm kind="payment-receipt" tool={paymentReceiptTool} />);

    fireEvent.change(screen.getByRole('textbox', { name: 'Business name' }), {
      target: { value: 'Ravi & Sons' },
    });
    fireEvent.change(screen.getByRole('textbox', { name: 'Business address' }), {
      target: { value: 'Market Road' },
    });
    await user.click(screen.getByRole('button', { name: 'Next' }));
    fireEvent.change(screen.getByRole('textbox', { name: 'Receipt number' }), {
      target: { value: 'RCPT/001' },
    });
    fireEvent.change(screen.getByLabelText(/Receipt date/), { target: { value: '2026-08-06' } });
    fireEvent.change(screen.getByRole('textbox', { name: 'Received from' }), { target: { value: 'Nikhil' } });
    fireEvent.change(screen.getByRole('textbox', { name: 'Amount received' }), {
      target: { value: '1250.50' },
    });
    fireEvent.change(screen.getByRole('textbox', { name: 'Payment purpose' }), {
      target: { value: 'Consulting retainer' },
    });
    await user.click(screen.getByRole('button', { name: 'Review document' }));

    expect(
      await screen.findByText('One Thousand Two Hundred Fifty Rupees and Fifty Paise Only'),
    ).toBeInTheDocument();
    expect(screen.getByText(/not bank confirmation, proof of settlement/iu)).toBeInTheDocument();
  });

  it('announces invalid receipt amounts and focuses the error summary', async () => {
    const user = userEvent.setup();
    render(<DocumentGeneratorForm kind="payment-receipt" tool={paymentReceiptTool} />);

    fireEvent.change(screen.getByRole('textbox', { name: 'Business name' }), {
      target: { value: 'Ravi & Sons' },
    });
    fireEvent.change(screen.getByRole('textbox', { name: 'Business address' }), {
      target: { value: 'Market Road' },
    });
    await user.click(screen.getByRole('button', { name: 'Next' }));
    fireEvent.change(screen.getByRole('textbox', { name: 'Receipt number' }), {
      target: { value: 'RCPT/001' },
    });
    fireEvent.change(screen.getByLabelText(/Receipt date/), { target: { value: '2026-08-06' } });
    fireEvent.change(screen.getByRole('textbox', { name: 'Received from' }), { target: { value: 'Nikhil' } });
    fireEvent.change(screen.getByRole('textbox', { name: 'Amount received' }), { target: { value: '-1' } });
    fireEvent.change(screen.getByRole('textbox', { name: 'Payment purpose' }), {
      target: { value: 'Consulting' },
    });
    await user.click(screen.getByRole('button', { name: 'Review document' }));

    const summary = await screen.findByRole('alert', { name: 'Check the highlighted fields' });
    await waitFor(() => expect(summary).toHaveFocus());
    expect(screen.getByRole('textbox', { name: 'Amount received' })).toHaveAttribute('aria-invalid', 'true');
    expect(summary).toHaveTextContent('Amount must be greater than zero');
  });

  it('resets a generated document after confirmation', async () => {
    const user = userEvent.setup();
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    render(<DocumentGeneratorForm kind="letterhead" tool={letterheadTool} />);

    fireEvent.change(screen.getByRole('textbox', { name: 'Business name' }), {
      target: { value: 'Reset Co' },
    });
    fireEvent.change(screen.getByRole('textbox', { name: 'Business address' }), {
      target: { value: 'Address' },
    });
    if (screen.queryByRole('button', { name: 'Next' })) {
      await user.click(screen.getByRole('button', { name: 'Next' }));
    }
    await user.click(screen.getByRole('button', { name: 'Review document' }));
    await screen.findByTestId('document-preview');
    await user.click(screen.getByRole('button', { name: 'Reset' }));
    fireEvent.click(document.querySelector('.document-steps button')!);

    await waitFor(() => {
      expect(screen.getByRole('textbox', { name: 'Business name' })).toHaveValue('');
      expect(screen.queryByTestId('document-preview')).not.toBeInTheDocument();
    });
  });
});
