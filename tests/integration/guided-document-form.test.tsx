import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import {
  GuidedDocumentForm,
  DocumentSection,
  type DocumentFlow,
} from '@/components/documents/guided-document-form';
const definition: DocumentFlow = {
  steps: [
    { id: 'parties', label: 'Parties', fields: ['business'] },
    { id: 'items', label: 'Items', fields: ['item'] },
    { id: 'review', label: 'Review', fields: [] },
  ],
};
describe('explicit document steps', () => {
  it('validates declared fields and keeps entered values across steps', () => {
    render(
      <GuidedDocumentForm
        definition={definition}
        validate={() => [{ field: 'item', code: 'required', message: 'Enter an item' }]}
        errors={[]}
        onPreview={vi.fn()}
      >
        <DocumentSection stepId="parties">
          <label htmlFor="business">Business</label>
          <input id="business" defaultValue="My shop" />
        </DocumentSection>
        <DocumentSection stepId="items">
          <label htmlFor="item">Item</label>
          <input id="item" />
        </DocumentSection>
      </GuidedDocumentForm>,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    expect(screen.getByLabelText('Item')).toBeVisible();
    fireEvent.click(screen.getByRole('button', { name: 'Review document' }));
    expect(screen.getByRole('alert')).toHaveTextContent('Enter an item');
    fireEvent.click(screen.getByRole('button', { name: 'Back' }));
    expect(screen.getByLabelText('Business')).toHaveValue('My shop');
  });
  it('generates a preview on Review and exposes edit actions without a field dump', () => {
    const preview = vi.fn();
    render(
      <GuidedDocumentForm definition={definition} validate={() => []} errors={[]} onPreview={preview}>
        <DocumentSection stepId="parties">
          <input aria-label="Business" />
        </DocumentSection>
        <DocumentSection stepId="items">
          <input aria-label="Item" />
        </DocumentSection>
      </GuidedDocumentForm>,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    fireEvent.click(screen.getByRole('button', { name: 'Review document' }));
    expect(preview).toHaveBeenCalledOnce();
    expect(screen.getByRole('button', { name: 'Edit parties' })).toBeVisible();
    expect(screen.queryByText('Review entered details')).not.toBeInTheDocument();
  });
});
