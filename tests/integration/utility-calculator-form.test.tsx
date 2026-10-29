import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { UtilityCalculatorForm } from '@/components/tooling/utility-calculator-form';
import { businessDaysTool, discountTool, percentageTool } from '@/domain/registry';

describe('everyday utility calculator form', () => {
  it('shows a seeded percentage result and recalculates after an input change', async () => {
    const user = userEvent.setup();
    render(<UtilityCalculatorForm kind="percentage" tool={percentageTool} />);
    const example = screen.queryByRole('button', { name: 'Try an example' });
    if (example) await user.click(example);

    expect(await screen.findByText('200')).toBeInTheDocument();

    const percentage = screen.getByRole('textbox', { name: 'Percentage' });
    await user.clear(percentage);
    await user.type(percentage, '25');

    expect(await screen.findByText('250')).toBeInTheDocument();
  });

  it('calculates percentage-of without changing the existing calculator adapters', async () => {
    const user = userEvent.setup();
    render(<UtilityCalculatorForm kind="percentage" tool={percentageTool} />);
    const example = screen.queryByRole('button', { name: 'Try an example' });
    if (example) await user.click(example);

    const base = screen.getByRole('textbox', { name: 'Base value' });
    await user.clear(base);
    await user.type(base, '1250');
    expect(base).toHaveValue('1250');
    const percentage = screen.getByRole('textbox', { name: 'Percentage' });
    await user.clear(percentage);
    await user.type(percentage, '12.5');
    expect(base).toHaveValue('1250');
    await user.click(screen.getByRole('button', { name: 'Calculate result' }));

    expect(await screen.findByText('156.25')).toBeInTheDocument();
    expect(screen.queryByText(/1250 × 12.5 ÷ 100/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Inputs and results stay in this browser/)).not.toBeInTheDocument();
  });

  it('shows successive discount savings and keeps GST outside the result', async () => {
    const user = userEvent.setup();
    render(<UtilityCalculatorForm kind="discount" tool={discountTool} />);
    const example = screen.queryByRole('button', { name: 'Try an example' });
    if (example) await user.click(example);

    await user.click(screen.getByText('Additional assumptions', { exact: true }));
    await user.type(screen.getByRole('textbox', { name: /Second discount/ }), '5');
    await user.click(screen.getByRole('button', { name: 'Calculate result' }));

    expect(await screen.findByText('₹855.00')).toBeInTheDocument();
    expect(screen.getByText('14.50%')).toBeInTheDocument();
    expect(screen.getByText(/GST and other charges are not added automatically/)).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Continue final price to GST Calculator' }),
    ).toBeInTheDocument();
  });

  it('counts an inclusive weekday range and exposes excluded-day details', async () => {
    const user = userEvent.setup();
    render(<UtilityCalculatorForm kind="business-days" tool={businessDaysTool} />);
    const example = screen.queryByRole('button', { name: 'Try an example' });
    if (example) await user.click(example);

    await user.click(screen.getByRole('button', { name: 'Calculate result' }));

    expect(await screen.findByText('5')).toBeInTheDocument();
    expect(screen.getByText(/5 calendar days reviewed/)).toBeInTheDocument();
    expect(screen.getByText('None')).toBeInTheDocument();
  });
});
