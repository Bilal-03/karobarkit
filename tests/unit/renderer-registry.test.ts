import { describe, expect, it } from 'vitest';

import { allToolDefinitions, toolRegistry } from '@/domain/registry';
import type { ToolUiAdapter } from '@/domain/registry/types';
import { toolRendererRegistry } from '@/components/tooling/tool-renderers';

describe('tool renderer registry', () => {
  it('maps every published and beta adapter to a renderer', () => {
    for (const tool of toolRegistry) {
      expect(toolRendererRegistry[tool.ui.adapter]).toBeTypeOf('function');
    }
  });

  it('keeps every routable definition on a deliberate renderer path', () => {
    const adapters = new Set(allToolDefinitions.map((tool) => tool.ui.adapter));
    const registeredAdapters = Object.keys(toolRendererRegistry);
    expect(registeredAdapters).toEqual(expect.arrayContaining([...adapters]));
    expect(
      registeredAdapters.filter((adapter) => !adapters.has(adapter as ToolUiAdapter['adapter'])),
    ).toEqual(['unavailable']);
  });

  it('retains an explicit unavailable renderer instead of a blank interaction area', () => {
    expect(toolRendererRegistry.unavailable).toBeTypeOf('function');
  });
});
