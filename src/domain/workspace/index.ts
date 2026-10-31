import { z } from 'zod';
import Decimal from 'decimal.js';
import { calculateBusinessEconomics } from '@/domain/calculations/business-economics';
import { quotationDefaultValues } from '@/domain/documents/quotation';
import { invoiceDefaultValues } from '@/domain/documents/invoice';
import { paymentReceiptDefaultValues } from '@/domain/documents/payment-receipt';

export const scenarioSchema = z
  .object({
    name: z.string().trim().min(1).max(80),
    price: z.string().max(24),
    cost: z.string().max(24),
    delivery: z.string().max(24),
    discount: z.string().max(24),
    units: z.string().max(24),
    fixed: z.string().max(24),
  })
  .strict();
export type Scenario = z.infer<typeof scenarioSchema>;
export const exampleScenario: Scenario = {
  name: 'Current offer',
  price: '1000',
  cost: '500',
  delivery: '100',
  discount: '0',
  units: '100',
  fixed: '20000',
};
export function compareScenario(input: Scenario) {
  const s = scenarioSchema.parse(input);
  const fields = ['price', 'cost', 'delivery', 'discount', 'units', 'fixed'] as const;
  const numbers = Object.fromEntries(
    fields.map((key) => {
      if (!/^\d+(\.\d{1,2})?$/.test(s[key]))
        throw new Error(`${key}: enter a non-negative number with at most two decimals.`);
      const n = new Decimal(s[key]);
      if (n.gt('999999999')) throw new Error(`${key}: value is too large.`);
      return [key, n];
    }),
  ) as Record<(typeof fields)[number], Decimal>;
  const { price, cost, delivery, discount, units, fixed } = numbers;
  if (price.lte(0) || discount.gte(100) || !units.isInteger())
    throw new Error('Price must be positive, discount below 100%, and units a whole number.');
  const netPrice = price
    .times(new Decimal(1).minus(discount.div(100)))
    .toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
  if (netPrice.lte(0))
    throw new Error('Discounted price rounds to zero. Increase price or reduce the discount.');
  const variable = cost.plus(delivery),
    contribution = netPrice.minus(variable),
    revenue = netPrice.times(units),
    profit = contribution.times(units).minus(fixed);
  const breakEven = contribution.gt(0)
    ? calculateBusinessEconomics('break-even', {
        fixedCosts: fixed.toString(),
        sellingPricePerUnit: netPrice.toString(),
        variableCostPerUnit: variable.toString(),
      }).headline.value
    : null;
  return {
    netPrice: netPrice.toFixed(2),
    contribution: contribution.toFixed(2),
    revenue: revenue.toFixed(2),
    profit: profit.toFixed(2),
    breakEven,
    margin: contribution.div(netPrice).times(100).toFixed(2),
    lowerVolumeProfit: contribution.times(units.times('0.8').floor()).minus(fixed).toFixed(2),
    higherCostProfit: netPrice.minus(variable.times('1.1')).times(units).minus(fixed).toFixed(2),
  };
}
export const documentTemplates = {
  quotation: quotationDefaultValues,
  invoice: invoiceDefaultValues,
  receipt: paymentReceiptDefaultValues,
};
export type DraftKind = keyof typeof documentTemplates;
// Only the structure of known document inputs is accepted, including incomplete strings.
function sameShape(value: unknown, template: unknown, depth = 0): boolean {
  if (depth > 8) return false;
  if (template === null) return value === null;
  if (typeof template === 'string') return typeof value === 'string' && value.length <= 10000;
  if (typeof template === 'boolean') return typeof value === 'boolean';
  if (Array.isArray(template))
    return (
      Array.isArray(value) && value.length <= 50 && value.every((v) => sameShape(v, template[0], depth + 1))
    );
  if (template && typeof template === 'object') {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
    const t = template as Record<string, unknown>,
      v = value as Record<string, unknown>;
    return (
      Object.keys(v).every((k) => Object.hasOwn(t, k)) &&
      Object.keys(t).every((k) => Object.hasOwn(v, k) && sameShape(v[k], t[k], depth + 1))
    );
  }
  return value === template;
}
const profileSchema = z
  .object({
    businessName: z.string().max(120),
    businessAddress: z.string().max(600),
    phone: z.string().max(100),
    email: z.string().max(254),
    gstin: z.string().max(100),
  })
  .strict();
export const emptyProfile = { businessName: '', businessAddress: '', phone: '', email: '', gstin: '' };
const entry = z
  .object({
    id: z.string().uuid(),
    name: z.string().trim().min(1).max(80),
    kind: z.enum(['quotation', 'invoice', 'receipt']),
    values: z.unknown(),
  })
  .strict()
  .superRefine((d, ctx) => {
    if (!sameShape(d.values, { ...documentTemplates[d.kind], logo: null }))
      ctx.addIssue({ code: 'custom', message: 'Draft does not match a supported document.' });
  });
const workspaceSchema = z
  .object({
    version: z.literal(1),
    profile: profileSchema,
    scenarios: z.array(scenarioSchema).max(3),
    drafts: z.array(entry).max(20),
  })
  .strict()
  .superRefine((d, ctx) => {
    if (new Set(d.drafts.map((x) => x.id)).size !== d.drafts.length)
      ctx.addIssue({ code: 'custom', message: 'Duplicate draft IDs.' });
  });
export type Workspace = z.infer<typeof workspaceSchema>;
export const blankWorkspace = (): Workspace => ({
  version: 1,
  profile: { ...emptyProfile },
  scenarios: [],
  drafts: [],
});
export const WORKSPACE_KEY = 'karobarkit:workspace:v1';
export function parseWorkspace(text: string): Workspace {
  if (new TextEncoder().encode(text).byteLength > 512000)
    throw new Error('Workspace exceeds 512 KB. Remove some drafts or use a smaller backup.');
  const result = workspaceSchema.safeParse(JSON.parse(text));
  if (!result.success)
    throw new Error(
      'This backup has an unsupported version or invalid data. Existing workspace was not changed.',
    );
  return result.data;
}
export function readWorkspace(): Workspace {
  const text = localStorage.getItem(WORKSPACE_KEY);
  return text ? parseWorkspace(text) : blankWorkspace();
}
export function writeWorkspace(value: Workspace) {
  const text = JSON.stringify(value);
  parseWorkspace(text);
  localStorage.setItem(WORKSPACE_KEY, text);
}
