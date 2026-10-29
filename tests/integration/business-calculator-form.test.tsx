import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { BusinessCalculatorForm } from '@/components/tooling/business-calculator-form';
import { marginTool, pricingTool } from '@/domain/registry';

describe('business calculator form integration', () => {
  it('renders a local margin scenario and interprets the result', async () => {
    const user = userEvent.setup();
    render(<BusinessCalculatorForm kind="margin" tool={marginTool} />);
    const example = screen.queryByRole('button', { name: 'Try an example' });
    if (example) await user.click(example);

    await user.click(screen.getByRole('button', { name: 'Calculate scenario' }));

    expect(await screen.findByText('30.00%')).toBeInTheDocument();
    expect(screen.getByText('₹30,000.00')).toBeInTheDocument();
    expect(screen.queryByText(/Values are not sent to analytics/)).not.toBeInTheDocument();
  });

  it('shows field-level boundary errors before pricing arithmetic runs', async () => {
    const user = userEvent.setup();
    render(<BusinessCalculatorForm kind="pricing" tool={pricingTool} />);
    const example = screen.queryByRole('button', { name: 'Try an example' });
    if (example) await user.click(example);

    const margin = screen.getByRole('textbox', { name: /Target margin/ });
    await user.clear(margin);
    await user.type(margin, '100');
    await user.click(screen.getByRole('button', { name: 'Calculate scenario' }));

    expect(
      await screen.findByText('Target margin must be below 100%.', { selector: '#targetMargin-error' }),
    ).toBeInTheDocument();
    expect(screen.queryByText('A decision-ready view')).not.toBeInTheDocument();
  });
});
