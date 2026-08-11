import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { BusinessCardGeneratorForm } from '@/components/documents/business-card-generator-form';
import { InvoiceGeneratorForm } from '@/components/documents/invoice-generator-form';
import { InvoiceNumberGeneratorForm } from '@/components/documents/invoice-number-generator-form';
import { QuotationGeneratorForm } from '@/components/documents/quotation-generator-form';
import { businessCardTool, invoiceNumberTool, invoiceTool, quotationTool } from '@/domain/registry';

describe('Phase 3 document workflow wave', () => {
  it('creates a quotation preview and keeps the estimate disclaimer visible', async () => {
    render(<QuotationGeneratorForm tool={quotationTool} />);
    fireEvent.change(screen.getByRole('textbox', { name: 'Business name' }), {
      target: { value: 'Ravi & Sons' },
    });
    fireEvent.change(screen.getByRole('textbox', { name: 'Business address' }), {
      target: { value: 'Market Road' },
    });
    fireEvent.change(screen.getByRole('textbox', { name: 'Quote number' }), {
      target: { value: 'QT/001' },
    });
    fireEvent.change(screen.getByLabelText(/Quote date/iu), { target: { value: '2026-08-06' } });
    fireEvent.change(screen.getByRole('textbox', { name: 'Customer name' }), {
      target: { value: 'Nikhil Foods' },
    });
    fireEvent.change(screen.getByRole('textbox', { name: 'Description' }), {
      target: { value: 'Consulting retainer' },
    });
    fireEvent.change(screen.getByRole('textbox', { name: 'Unit price' }), {
      target: { value: '1900' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Create quotation' }));

    expect(await screen.findByTestId('document-preview')).toBeInTheDocument();
    expect(screen.getAllByText('₹1,900.00')).not.toHaveLength(0);
    expect(screen.getAllByText(/not a GST tax invoice/iu)).not.toHaveLength(0);
  }, 15_000);

  it('creates a business card proof', async () => {
    render(<BusinessCardGeneratorForm tool={businessCardTool} />);
    fireEvent.change(screen.getByRole('textbox', { name: 'Business name' }), {
      target: { value: 'Ravi & Sons' },
    });
    fireEvent.change(screen.getByRole('textbox', { name: 'Business address' }), {
      target: { value: 'Market Road' },
    });
    fireEvent.change(screen.getByRole('textbox', { name: 'Person name' }), {
      target: { value: 'Nikhil Sharma' },
    });
    fireEvent.change(screen.getByRole('textbox', { name: /Card email/iu }), {
      target: { value: 'nikhil@example.com' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Create business card' }));

    expect(await screen.findByTestId('document-preview')).toBeInTheDocument();
    expect(screen.getByText('Nikhil Sharma')).toBeInTheDocument();
    expect(screen.getByText(/trim after printing/iu)).toBeInTheDocument();
  }, 15_000);

  it('previews an invoice number without claiming reservation', async () => {
    const user = userEvent.setup();
    render(<InvoiceNumberGeneratorForm tool={invoiceNumberTool} />);
    await user.click(screen.getByRole('button', { name: 'Generate invoice number' }));

    expect(await screen.findByTestId('invoice-number-result')).toHaveTextContent('INV/2026-27/0001');
    expect(screen.getAllByText(/does not reserve or guarantee uniqueness/iu)).not.toHaveLength(0);
  });

  it('creates a commercial invoice and keeps the non-GST boundary visible', async () => {
    render(<InvoiceGeneratorForm tool={invoiceTool} />);
    fireEvent.change(screen.getByRole('textbox', { name: 'Business name' }), {
      target: { value: 'Ravi & Sons' },
    });
    fireEvent.change(screen.getByRole('textbox', { name: 'Business address' }), {
      target: { value: 'Market Road' },
    });
    fireEvent.change(screen.getByRole('textbox', { name: 'Invoice number' }), {
      target: { value: 'INV/001' },
    });
    fireEvent.change(screen.getByLabelText(/Invoice date/iu), { target: { value: '2026-08-06' } });
    fireEvent.change(screen.getByRole('textbox', { name: 'Customer name' }), {
      target: { value: 'Nikhil Foods' },
    });
    fireEvent.change(screen.getByRole('textbox', { name: 'Description' }), {
      target: { value: 'Consulting retainer' },
    });
    fireEvent.change(screen.getByRole('textbox', { name: 'Unit price' }), {
      target: { value: '1900' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Create invoice draft' }));

    expect(await screen.findByTestId('document-preview')).toBeInTheDocument();
    expect(screen.getAllByText(/not a GST tax invoice/iu)).not.toHaveLength(0);
    expect(screen.getAllByText('₹1,900.00')).not.toHaveLength(0);
  }, 15_000);
});
