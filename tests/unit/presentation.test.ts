import { describe, it, expect } from 'vitest';
import { toolRegistry } from '@/domain/registry';
import { toolPresentations, taskGroups } from '@/domain/registry/presentation';
import { filterToolDirectory } from '@/domain/discovery';
describe('tool presentation coverage', () => {
  it('defines a deliberate presentation and help destination for every available tool', () => {
    for (const tool of toolRegistry) {
      const p = toolPresentations[tool.id];
      expect(p, tool.id).toBeDefined();
      expect(p.helpPath).toBe(`/tools/${tool.slug}/help`);
      expect(taskGroups.map((g) => g.id)).toContain(p.group);
      const all = [
        ...p.primaryFields,
        ...p.conditionalFields,
        ...p.additionalSections.flatMap((s) => s.fields),
      ];
      expect(new Set(all).size, tool.id).toBe(all.length);
      for (const key of Object.keys(tool.defaultValues as object))
        expect(all, `${tool.id}:${key}`).toContain(key);
    }
  });
  it('keeps common GST and EMI tasks focused', () => {
    expect(toolPresentations['gst-calculator'].primaryFields).toEqual(['amount', 'ratePresetId', 'mode']);
    expect(toolPresentations['emi-calculator'].primaryFields).toHaveLength(3);
  });
});
