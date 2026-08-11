import { z } from 'zod';

import { validationFromSchema } from '@/domain/calculations/utilities/shared';
import type { ValidationResult } from '@/domain/calculations/types';

export const todoPriorities = ['low', 'normal', 'high'] as const;
export type TodoPriority = (typeof todoPriorities)[number];

export const todoTaskSchema = z.object({
  id: z.string().min(1).max(80),
  text: z.string().trim().min(1, 'Enter a task.').max(240, 'Keep each task under 240 characters.'),
  priority: z.enum(todoPriorities),
  completed: z.boolean(),
});

export const todoInputSchema = z.object({
  tasks: z.array(todoTaskSchema).max(200, 'Keep the checklist to 200 tasks or fewer.'),
});

export type TodoTask = z.infer<typeof todoTaskSchema>;
export type TodoInput = z.infer<typeof todoInputSchema>;

export interface TodoChecklistResult {
  total: number;
  completed: number;
  remaining: number;
  progressPercent: number;
  highPriorityRemaining: number;
}

export function validateTodoInput(input: TodoInput): ValidationResult<TodoInput> {
  return validationFromSchema(todoInputSchema, input);
}

export function calculateTodoChecklist(input: TodoInput): TodoChecklistResult {
  const validation = validateTodoInput(input);
  if (!validation.success) throw new Error(validation.errors[0]?.message ?? 'Invalid checklist.');
  const total = validation.data.tasks.length;
  const completed = validation.data.tasks.filter((task) => task.completed).length;
  return {
    total,
    completed,
    remaining: total - completed,
    progressPercent: total === 0 ? 0 : Math.round((completed / total) * 10000) / 100,
    highPriorityRemaining: validation.data.tasks.filter((task) => task.priority === 'high' && !task.completed)
      .length,
  };
}

export function createTodoTask(text: string, priority: TodoPriority): TodoTask {
  const id =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `task-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const parsed = todoTaskSchema.safeParse({ id, text, priority, completed: false });
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? 'Enter a valid task.');
  return parsed.data;
}
