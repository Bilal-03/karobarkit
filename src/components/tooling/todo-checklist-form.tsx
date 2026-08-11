'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

import {
  calculateTodoChecklist,
  createTodoTask,
  type TodoPriority,
  type TodoTask,
} from '@/domain/utilities/todo';
import { formatIndianNumber } from '@/domain/formatting/indian';
import { trackEvent } from '@/lib/analytics';

import { Button } from '@/components/ui/button';
import { InputField, SelectField } from '@/components/ui/form-field';
import { ResultPanel } from '@/components/ui/result-panel';
import { PrivacyBlock, StateBlock } from '@/components/ui/trust-blocks';

interface TodoChecklistFormProps {
  tool: { id: string; category: string; defaultValues: unknown; privacyNote: string };
}

function escapeCsv(value: string) {
  return `"${value.replace(/"/g, '""')}"`;
}

function downloadCsv(tasks: TodoTask[]) {
  const rows = [
    ['Task', 'Priority', 'Completed'],
    ...tasks.map((task) => [task.text, task.priority, task.completed ? 'Yes' : 'No']),
  ];
  const blob = new Blob([rows.map((row) => row.map(escapeCsv).join(',')).join('\n')], {
    type: 'text/csv;charset=utf-8',
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = 'karobarkit-checklist.csv';
  anchor.click();
  URL.revokeObjectURL(url);
}

export function TodoChecklistForm({ tool }: TodoChecklistFormProps) {
  const initialTasks = useMemo(
    () => (tool.defaultValues as { tasks?: TodoTask[] })?.tasks ?? [],
    [tool.defaultValues],
  );
  const [tasks, setTasks] = useState<TodoTask[]>(initialTasks);
  const [taskText, setTaskText] = useState('');
  const [priority, setPriority] = useState<TodoPriority>('normal');
  const [error, setError] = useState<string | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);
  const [isInteractive, setIsInteractive] = useState(false);
  const resultRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => setIsInteractive(true));
    trackEvent('tool_viewed', { toolId: tool.id, category: tool.category });
    return () => window.cancelAnimationFrame(frame);
  }, [tool.category, tool.id]);

  const summary = calculateTodoChecklist({ tasks });

  function addTask(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      const nextTask = createTodoTask(taskText, priority);
      setTasks((current) => [...current, nextTask]);
      setTaskText('');
      setError(null);
      trackEvent('tool_started', { toolId: tool.id });
      trackEvent('result_generated', { toolId: tool.id });
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : 'Enter a valid task.');
    }
  }

  function toggleTask(id: string) {
    setTasks((current) =>
      current.map((task) => (task.id === id ? { ...task, completed: !task.completed } : task)),
    );
  }

  function printChecklist() {
    window.print();
    trackEvent('result_printed', { toolId: tool.id, pageSize: 'a4' });
  }

  async function exportPdf() {
    setExportError(null);
    try {
      const { downloadChecklistPdf } = await import('@/lib/documents/checklist-pdf');
      await downloadChecklistPdf(tasks);
      trackEvent('result_downloaded', { toolId: tool.id, format: 'pdf', pageSize: 'a4' });
    } catch (nextError) {
      setExportError(
        nextError instanceof Error ? nextError.message : 'We could not prepare the PDF. Try Print instead.',
      );
    }
  }

  return (
    <div className="calculator-layout">
      <section className="calculator-card" aria-labelledby="todo-form-title">
        <div className="calculator-card__heading">
          <div>
            <p className="eyebrow">Memory-first worksheet</p>
            <h2 id="todo-form-title">Build a checklist</h2>
          </div>
          <span className="local-badge">No account</span>
        </div>
        <form onSubmit={addTask} noValidate data-interactive={isInteractive ? 'true' : 'false'}>
          <InputField
            id="taskText"
            label="Task"
            help="Tasks stay in memory until you print, export or close this page."
            value={taskText}
            onChange={(event) => {
              setTaskText(event.target.value);
              setError(null);
            }}
            error={error ?? undefined}
            autoComplete="off"
            required
          />
          <SelectField
            id="priority"
            label="Priority"
            value={priority}
            onChange={(event) => setPriority(event.target.value as TodoPriority)}
          >
            <option value="low">Low</option>
            <option value="normal">Normal</option>
            <option value="high">High</option>
          </SelectField>
          <Button type="submit" fullWidth>
            Add task
          </Button>
        </form>
        <p className="field__help">
          Tasks are not persisted automatically. Export or print a copy when you choose.
        </p>
      </section>
      <section
        className="calculator-result"
        ref={resultRef}
        tabIndex={-1}
        aria-labelledby="todo-result-title"
      >
        <div className="calculator-result__heading">
          <div>
            <p className="eyebrow">Your checklist</p>
            <h2 id="todo-result-title">Progress at a glance</h2>
          </div>
          <span className="result-status">Local</span>
        </div>
        <ResultPanel
          label="Progress"
          value={`${formatIndianNumber(summary.progressPercent, { decimals: 2 })}%`}
          detail={`${summary.completed} of ${summary.total} tasks complete`}
          tone={summary.remaining === 0 && summary.total > 0 ? 'positive' : 'neutral'}
        >
          <dl className="result-breakdown">
            <div>
              <dt>Remaining</dt>
              <dd>{formatIndianNumber(summary.remaining)}</dd>
            </div>
            <div>
              <dt>High priority remaining</dt>
              <dd>{formatIndianNumber(summary.highPriorityRemaining)}</dd>
            </div>
          </dl>
        </ResultPanel>
        {tasks.length ? (
          <ul className="checklist" aria-label="Checklist tasks">
            {tasks.map((task) => (
              <li
                className={`checklist__item${task.completed ? ' checklist__item--complete' : ''}`}
                key={task.id}
              >
                <label>
                  <input type="checkbox" checked={task.completed} onChange={() => toggleTask(task.id)} />
                  <span>{task.text}</span>
                </label>
                <span className="checklist__priority">{task.priority}</span>
              </li>
            ))}
          </ul>
        ) : (
          <StateBlock titleId="todo-empty-title" title="No tasks yet" tone="empty">
            Add a task to start a private checklist.
          </StateBlock>
        )}
        {tasks.length ? (
          <div className="inline-actions scenario-actions">
            <Button type="button" variant="secondary" onClick={() => downloadCsv(tasks)}>
              Download CSV
            </Button>
            <Button type="button" variant="secondary" onClick={exportPdf}>
              Download PDF
            </Button>
            <Button type="button" variant="ghost" onClick={printChecklist}>
              Print A4
            </Button>
          </div>
        ) : null}
        {exportError ? (
          <p className="field__error" role="alert">
            {exportError}
          </p>
        ) : null}
        <PrivacyBlock>{tool.privacyNote}</PrivacyBlock>
      </section>
    </div>
  );
}
