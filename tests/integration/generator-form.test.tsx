import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/qr/render', () => ({
  renderQrPngDataUrl: vi.fn(async () => 'data:image/png;base64,iVBORw0KGgo='),
}));

import { GeneratorForm } from '@/components/tooling/generator-form';
import { upiStandeeTool, urlQrTool } from '@/domain/registry';

describe('generator form integration', () => {
  it('shows the seeded URL QR preview immediately and refreshes while typing', async () => {
    const user = userEvent.setup();
    render(<GeneratorForm kind="url-qr" tool={urlQrTool} />);

    expect(await screen.findByText('https://example.com/')).toBeInTheDocument();
    const url = screen.getByRole('textbox', { name: 'URL' });
    await user.clear(url);
    await user.type(url, 'https://example.org/menu');

    expect(await screen.findByText('https://example.org/menu')).toBeInTheDocument();
  });

  it('announces an unsafe URL protocol and links the error to the field', async () => {
    const user = userEvent.setup();
    render(<GeneratorForm kind="url-qr" tool={urlQrTool} />);

    const url = screen.getByRole('textbox', { name: 'URL' });
    await user.clear(url);
    await user.type(url, 'javascript:alert(1)');
    await user.click(screen.getByRole('button', { name: 'Generate QR code' }));

    const summary = await screen.findByRole('alert', { name: 'Check the highlighted fields' });
    await waitFor(() => expect(summary).toHaveFocus());
    expect(screen.getByRole('textbox', { name: 'URL' })).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getAllByText(/Only HTTP and HTTPS URLs are supported/).length).toBeGreaterThanOrEqual(1);
  });

  it('generates a local URL QR preview after normalizing a bare domain', async () => {
    const user = userEvent.setup();
    render(<GeneratorForm kind="url-qr" tool={urlQrTool} />);

    const url = screen.getByRole('textbox', { name: 'URL' });
    await user.clear(url);
    await user.type(url, 'example.com/menu');
    await user.click(screen.getByRole('button', { name: 'Generate QR code' }));

    expect(await screen.findByTestId('qr-preview')).toBeInTheDocument();
    expect(screen.getByText('https://example.com/menu')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Download PNG' })).toBeEnabled();
  });

  it('constructs an encoded UPI URI and exposes the ownership disclaimer', async () => {
    const user = userEvent.setup();
    render(<GeneratorForm kind="upi-standee" tool={upiStandeeTool} />);

    const payee = screen.getByRole('textbox', { name: 'Payee name' });
    const upiId = screen.getByRole('textbox', { name: 'UPI ID' });
    const amount = screen.getByRole('textbox', { name: 'Fixed amount (optional)' });
    const note = screen.getByRole('textbox', { name: 'Payment note (optional)' });
    await user.clear(payee);
    await user.clear(upiId);
    await user.clear(amount);
    await user.clear(note);
    await user.type(payee, 'Ravi & Sons');
    await user.type(upiId, 'ravi.shop@bank');
    await user.type(amount, '125.50');
    await user.type(note, 'Order #1 & tea');
    await user.click(screen.getByRole('button', { name: 'Generate UPI standee' }));

    expect(await screen.findByTestId('upi-payment-uri')).toHaveTextContent(
      'upi://pay?pa=ravi.shop%40bank&pn=Ravi%20%26%20Sons&am=125.5&cu=INR&tn=Order%20%231%20%26%20tea',
    );
    expect(screen.getByText(/not proof that the account exists/)).toBeInTheDocument();
    expect(await screen.findByTestId('qr-preview')).toBeInTheDocument();
  });

  it('resets generated values after confirmation', async () => {
    const user = userEvent.setup();
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    render(<GeneratorForm kind="url-qr" tool={urlQrTool} />);

    const url = screen.getByRole('textbox', { name: 'URL' });
    await user.type(url, 'https://example.com');
    await user.click(screen.getByRole('button', { name: 'Generate QR code' }));
    await screen.findByTestId('qr-preview');
    await user.click(screen.getByRole('button', { name: 'Reset' }));

    expect(url).toHaveValue('https://example.com');
    expect(await screen.findByTestId('qr-preview')).toBeInTheDocument();
  });
});
