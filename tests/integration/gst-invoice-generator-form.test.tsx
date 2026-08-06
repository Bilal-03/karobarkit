import { render, screen } from '@testing-library/react';
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

async function fillMinimumInvoice() {
  const user = userEvent.setup();
  await user.type(field('invoiceNumber'), 'INV-001');
  await user.type(field('supplier.legalName'), 'Supplier Private Limited');
  await user.type(field('supplier.gstin'), '27ABCDE1234F1Z5');
  await user.type(field('supplier.address.line1'), '12 Market Road');
  await user.type(field('supplier.address.city'), 'Pune');
  await user.type(field('supplier.address.state'), 'Maharashtra');
  await user.type(field('supplier.address.stateCode'), '27');
  await user.type(field('supplier.address.postalCode'), '411001');
  await user.type(field('recipient.legalName'), 'Recipient Private Limited');
  await user.type(field('recipient.gstin'), '29ABCDE1234F1Z5');
  await user.type(field('recipient.address.line1'), '44 Business Park');
  await user.type(field('recipient.address.city'), 'Bengaluru');
  await user.type(field('recipient.address.state'), 'Karnataka');
  await user.type(field('recipient.address.stateCode'), '29');
  await user.type(field('recipient.address.postalCode'), '560001');
  await user.type(field('items.0.description'), 'Consulting service');
  await user.type(field('items.0.unitPrice'), '1000');
  return user;
}

describe('GST invoice generator form', () => {
  it('announces validation errors and keeps the first item undeletable', async () => {
    const user = userEvent.setup();
    render(<GstInvoiceGeneratorForm tool={gstInvoiceTool} />);

    await user.click(screen.getByRole('button', { name: 'Create GST invoice draft' }));

    expect(await screen.findByText('Check the highlighted fields')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Remove item 1' })).toBeDisabled();
    expect(screen.getByRole('alert', { name: 'Check the highlighted fields' })).toBeInTheDocument();
  });

  it('adds and removes an item and creates the minimum valid invoice preview', async () => {
    render(<GstInvoiceGeneratorForm tool={gstInvoiceTool} />);
    const user = await fillMinimumInvoice();

    await user.click(screen.getByRole('button', { name: 'Add item' }));
    expect(screen.getByText('Item 2')).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /Remove item/iu })).toHaveLength(2);
    await user.click(screen.getByRole('button', { name: 'Remove item 2' }));
    expect(screen.queryByText('Item 2')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Create GST invoice draft' }));
    expect(await screen.findByTestId('document-preview')).toBeInTheDocument();
    expect(screen.getByText('Tax Invoice')).toBeInTheDocument();
    expect(screen.getAllByText('₹1,180.00').length).toBeGreaterThan(0);
    expect(screen.getAllByText(/local draft/i).length).toBeGreaterThan(0);
  }, 30_000);
});
