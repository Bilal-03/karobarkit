import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { TodoChecklistForm } from '@/components/tooling/todo-checklist-form';
import { todoChecklistTool } from '@/domain/registry';

describe('to-do checklist form', () => {
  it('keeps tasks in the active page and derives progress', async () => {
    const user = userEvent.setup();
    render(<TodoChecklistForm tool={todoChecklistTool} />);

    await user.type(screen.getByRole('textbox', { name: 'Task' }), 'Send quotation');
    await user.click(screen.getByRole('button', { name: 'Add task' }));

    expect(await screen.findByText('Send quotation')).toBeInTheDocument();
    expect(screen.getByText('0.00%')).toBeInTheDocument();

    await user.click(screen.getByRole('checkbox'));
    expect(screen.getByText('100.00%')).toBeInTheDocument();
    expect(screen.getByText(/Tasks remain in this browser session/)).toBeInTheDocument();
  });
});
