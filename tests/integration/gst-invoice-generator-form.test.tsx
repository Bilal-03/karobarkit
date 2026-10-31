import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { GstInvoiceGeneratorForm } from '@/components/documents/gst-invoice-generator-form';
import { gstInvoiceTool } from '@/domain/registry';

function field(id: string) {
  const element = document.getElementById(id);
  if (!(element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement)) {
    throw new Error(`Field ${id} not found.`);
  }
  return element;
}

function fillMinimumInvoice() {
  const values: Record<string, string> = {
    invoiceNumber: 'INV-001',
    'placeOfSupply.state': 'Karnataka',
    'placeOfSupply.stateCode': '29',
    'supplier.legalName': 'Supplier Private Limited',
    'supplier.gstin': '27ABCDE1234F1Z5',
    'supplier.address.line1': '12 Market Road',
    'supplier.address.city': 'Pune',
    'supplier.address.state': 'Maharashtra',
    'supplier.address.stateCode': '27',
    'supplier.address.postalCode': '411001',
    'recipient.legalName': 'Recipient Private Limited',
    'recipient.gstin': '29ABCDE1234F1Z5',
    'recipient.address.line1': '44 Business Park',
    'recipient.address.city': 'Bengaluru',
    'recipient.address.state': 'Karnataka',
    'recipient.address.stateCode': '29',
    'recipient.address.postalCode': '560001',
    'items.0.description': 'Consulting service',
    'items.0.unitPrice': '1000',
  };

  fireEvent.change(document.getElementById('supplyType')!, { target: { value: 'inter-state' } });
  fireEvent.change(document.getElementById('items.0.ratePresetId')!, {
    target: { value: 'gst-headline-rate-18' },
  });
  for (const [id, value] of Object.entries(values)) {
    fireEvent.change(field(id), { target: { value } });
  }
}

describe('GST invoice generator form', () => {
  it('shows the policy selected by invoice date and blocks unsupported history', async () => {
    render(<GstInvoiceGeneratorForm tool={gstInvoiceTool} />);

    fillMinimumInvoice();
    const invoiceDate = document.getElementById('invoiceDate');
    if (!invoiceDate) throw new Error('Invoice date field not found.');
    fireEvent.change(invoiceDate, { target: { value: '2024-01-01' } });

    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    fireEvent.click(screen.getByRole('button', { name: 'Review document' }));
    expect(await screen.findAllByText(/No active GST policy covers the requested date/iu)).not.toHaveLength(
      0,
    );
  }, 30_000);

  it('creates an invoice dated after the bundled policy review', async () => {
    render(<GstInvoiceGeneratorForm tool={gstInvoiceTool} />);
    const invoiceDate = document.getElementById('invoiceDate');
    if (!invoiceDate) throw new Error('Invoice date field not found.');
    fillMinimumInvoice();
    fireEvent.change(invoiceDate, { target: { value: '2026-10-31' } });
    fireEvent.change(field('dueDate'), { target: { value: '' } });
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    fireEvent.click(screen.getByRole('button', { name: 'Review document' }));
    expect(await screen.findByTestId('document-preview')).toBeInTheDocument();
  });

  it('announces validation errors and keeps the first item undeletable', async () => {
    const user = userEvent.setup();
    render(<GstInvoiceGeneratorForm tool={gstInvoiceTool} />);

    fireEvent.change(field('invoiceNumber'), { target: { value: '' } });

    fillMinimumInvoice();
    fireEvent.change(field('invoiceNumber'), { target: { value: '' } });
    await user.click(screen.getByRole('button', { name: 'Next' }));
    await user.click(screen.getByRole('button', { name: 'Review document' }));

    expect(await screen.findByText('Check the highlighted fields')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Remove item 1', hidden: true })).toBeDisabled();
    expect(screen.getByRole('alert', { name: 'Check the highlighted fields' })).toBeInTheDocument();
  });

  it('adds and removes an item and creates the minimum valid invoice preview', async () => {
    render(<GstInvoiceGeneratorForm tool={gstInvoiceTool} />);
    fillMinimumInvoice();

    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    fireEvent.click(screen.getByRole('button', { name: 'Add item' }));
    expect(screen.getByText('Item 2')).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /Remove item/iu })).toHaveLength(2);
    fireEvent.click(screen.getByRole('button', { name: 'Remove item 2' }));
    expect(screen.queryByText('Item 2')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Review document' }));
    expect(await screen.findByTestId('document-preview')).toBeInTheDocument();
    expect(screen.getByText('Tax Invoice')).toBeInTheDocument();
    expect(screen.getAllByText('₹1,180.00').length).toBeGreaterThan(0);
    expect(screen.getAllByText(/local draft/i).length).toBeGreaterThan(0);
  }, 30_000);
});
