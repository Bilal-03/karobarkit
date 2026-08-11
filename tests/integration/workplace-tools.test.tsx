import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { WorkplaceDocumentForm } from '@/components/documents/workplace-document-form';
import { WorkplaceCalculatorForm } from '@/components/tooling/workplace-calculator-form';
import {
  leaveBalanceTool,
  menuTool,
  noticePeriodTool,
  priceTagTool,
  purchaseOrderTool,
} from '@/domain/registry';

describe('retail and workplace tool forms', () => {
  it('generates a price-tag preview through the shared document renderer', async () => {
    const user = userEvent.setup();
    render(<WorkplaceDocumentForm kind="price-tag" tool={priceTagTool} />);

    await user.type(screen.getByRole('textbox', { name: 'Business name' }), 'Shop');
    await user.type(screen.getByRole('textbox', { name: 'Product name' }), 'Notebook');
    await user.click(screen.getByRole('button', { name: 'Generate price tag' }));

    expect(await screen.findByText('Price Tag')).toBeInTheDocument();
    expect(screen.getAllByText('Draft').length).toBeGreaterThan(0);
    expect(screen.getByText('₹900.00')).toBeInTheDocument();
  });

  it('calculates notice-period estimates without exposing raw inputs to analytics', async () => {
    const user = userEvent.setup();
    render(<WorkplaceCalculatorForm kind="notice-period" tool={noticePeriodTool} />);

    await user.click(screen.getByRole('button', { name: 'Calculate locally' }));

    expect(await screen.findByText('9 September 2026')).toBeInTheDocument();
    expect(screen.getByText(/Contract wording and employer policy remain authoritative/)).toBeInTheDocument();
  });

  it('shows a declared leave balance under the selected monthly policy', async () => {
    const user = userEvent.setup();
    render(<WorkplaceCalculatorForm kind="leave-balance" tool={leaveBalanceTool} />);

    await user.click(screen.getByRole('button', { name: 'Calculate balance' }));

    expect(await screen.findByText('12 days')).toBeInTheDocument();
    expect(screen.getByText(/employer leave ledger/)).toBeInTheDocument();
  });

  it('adds and calculates multiple purchase-order lines', async () => {
    render(<WorkplaceDocumentForm kind="purchase-order" tool={purchaseOrderTool} />);

    fireEvent.change(screen.getByRole('textbox', { name: 'Buyer name' }), {
      target: { value: 'Buyer' },
    });
    fireEvent.change(screen.getByRole('textbox', { name: 'Buyer address' }), {
      target: { value: 'Buyer address' },
    });
    fireEvent.change(screen.getByRole('textbox', { name: 'Supplier name' }), {
      target: { value: 'Supplier' },
    });
    fireEvent.change(screen.getByRole('textbox', { name: 'Supplier address' }), {
      target: { value: 'Supplier address' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Add item' }));
    const secondDescription = document.getElementById('workplace-item-1-description') as HTMLInputElement;
    const secondPrice = document.getElementById('workplace-item-1-unit-price') as HTMLInputElement;
    fireEvent.change(secondDescription, { target: { value: 'Second item' } });
    fireEvent.change(secondPrice, { target: { value: '50' } });
    fireEvent.click(screen.getByRole('button', { name: 'Generate purchase order' }));

    expect(await screen.findByText('Second item')).toBeInTheDocument();
    expect(screen.getAllByText('₹150.00').length).toBeGreaterThan(0);
  }, 15_000);

  it('adds menu items and sections without collapsing earlier entries', async () => {
    const user = userEvent.setup();
    render(<WorkplaceDocumentForm kind="menu" tool={menuTool} />);

    await user.type(screen.getByRole('textbox', { name: 'Business name' }), 'Cafe');
    await user.click(screen.getByRole('button', { name: 'Add menu item' }));
    await user.type(screen.getByRole('textbox', { name: 'Item 2 name' }), 'Tea');
    await user.click(screen.getByRole('button', { name: 'Add menu section' }));
    await user.type(screen.getAllByRole('textbox', { name: 'Section heading' })[1]!, 'Desserts');
    await user.type(screen.getAllByRole('textbox', { name: 'Item 1 name' })[1]!, 'Cake');
    await user.click(screen.getByRole('button', { name: 'Generate menu' }));

    expect(await screen.findByText('Tea')).toBeInTheDocument();
    expect(screen.getByText('Desserts')).toBeInTheDocument();
    expect(screen.getByText('Cake')).toBeInTheDocument();
  });
});
