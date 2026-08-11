import {
  areaInputSchema,
  calculateArea,
  type AreaInput,
  type AreaResult,
  validateAreaInput,
  businessDaysInputSchema,
  calculateBusinessDays,
  type BusinessDaysInput,
  type BusinessDaysResult,
  validateBusinessDaysInput,
  calculateDiscount,
  discountInputSchema,
  type DiscountInput,
  type DiscountResult,
  validateDiscountInput,
  calculateFuelExpense,
  fuelInputSchema,
  type FuelInput,
  type FuelResult,
  validateFuelInput,
  calculatePercentage,
  percentageInputSchema,
  type PercentageInput,
  type PercentageResult,
  validatePercentageInput,
  calculateVolumetricWeight,
  type VolumetricWeightInput,
  type VolumetricWeightResult,
  validateVolumetricWeightInput,
  volumetricWeightInputSchema,
} from '@/domain/calculations/utilities';
import {
  calculateWordCounter,
  type WordCounterInput,
  type WordCounterResult,
  validateWordCounterInput,
  wordCounterInputSchema,
} from '@/domain/utilities/word-counter';
import {
  calculatePasswordToolkit,
  passwordToolkitInputSchema,
  type PasswordToolkitInput,
  type PasswordToolkitResult,
  validatePasswordToolkitInput,
} from '@/domain/utilities/password';
import {
  calculateTodoChecklist,
  type TodoChecklistResult,
  type TodoInput,
  todoInputSchema,
  validateTodoInput,
} from '@/domain/utilities/todo';
import { formatIndianCurrency, formatIndianNumber, formatPercentage } from '@/domain/formatting/indian';

import type { SourceReference, ToolCapability, ToolDefinition, ToolKind, ToolUiAdapter } from '../types';
import { liveLocalMetadata, sharedAnalyticsPolicy } from '../shared';

export const EVERYDAY_UTILITIES_FEATURE_FLAG = 'everyday-utilities-wave';
export const EVERYDAY_UTILITIES_LAST_REVIEWED = '2026-08-10';

const everydayUtilitiesSource: SourceReference = {
  id: 'karobarkit-everyday-utilities-methods-v1',
  title: 'Everyday Utilities methodology v1',
  publisher: 'KarobarKit controlled methodology',
  url: 'https://github.com/Bilal-03/karobarkit/blob/main/docs/product-spec/everyday-tools-expansion-implementation-plan.md',
  lastChecked: EVERYDAY_UTILITIES_LAST_REVIEWED,
  evidenceLevel: 'authoritative',
  documentType: 'methodology',
  notes:
    'Local-only arithmetic, conversion and productivity methods. User-entered prices, region definitions and transport assumptions are not verified externally.',
  supports: ['everyday utility formulas', 'rounding and scope limitations', 'privacy boundary'],
};

type UtilityConfig<TInput, TResult> = {
  id: string;
  slug: string;
  kind: ToolKind;
  ui: ToolUiAdapter;
  name: string;
  shortName: string;
  category: string;
  categoryLabel: string;
  secondaryCategories: string[];
  generatorKind?: 'qr' | 'document' | 'sequence';
  tags: string[];
  searchTerms: string[];
  summary: string;
  featured?: boolean;
  launchPriority?: number;
  riskTier: 'A' | 'B' | 'C';
  method: string;
  capabilities?: readonly ToolCapability[];
  defaultValues: TInput;
  inputSchema: ToolDefinition<TInput, TResult>['inputSchema'];
  validate: ToolDefinition<TInput, TResult>['validate'];
  calculate: ToolDefinition<TInput, TResult>['calculate'];
  renderResult: ToolDefinition<TInput, TResult>['renderResult'];
  limitations: string[];
  seoTitle: string;
  seoDescription: string;
  relatedToolIds: string[];
  howToUse: string[];
  formula: string;
  workedExample: string;
  resultInterpretation: string;
  edgeCases: string[];
  faqs: { question: string; answer: string }[];
  privacyNote: string;
  disclaimer?: string;
};

function createUtilityTool<TInput, TResult>(
  config: UtilityConfig<TInput, TResult>,
): ToolDefinition<TInput, TResult> {
  return {
    id: config.id,
    slug: config.slug,
    kind: config.kind,
    generatorKind: config.generatorKind,
    ui: config.ui,
    name: config.name,
    shortName: config.shortName,
    category: config.category,
    categoryLabel: config.categoryLabel,
    secondaryCategories: config.secondaryCategories,
    tags: config.tags,
    searchTerms: config.searchTerms,
    summary: config.summary,
    featured: config.featured ?? false,
    launchPriority: config.launchPriority ?? 90,
    ...liveLocalMetadata({
      riskTier: config.riskTier,
      reviewCadenceDays: 365,
      method: config.method,
      lastVerified: EVERYDAY_UTILITIES_LAST_REVIEWED,
      lifecycle: 'beta',
      featureFlag: EVERYDAY_UTILITIES_FEATURE_FLAG,
      capabilities: config.capabilities ?? [],
    }),
    inputSchema: config.inputSchema,
    defaultValues: config.defaultValues,
    validate: config.validate,
    calculate: config.calculate,
    renderResult: config.renderResult,
    sources: [everydayUtilitiesSource],
    limitations: config.limitations,
    lastReviewed: EVERYDAY_UTILITIES_LAST_REVIEWED,
    seo: { title: config.seoTitle, description: config.seoDescription, keywords: config.searchTerms },
    relatedToolIds: config.relatedToolIds,
    analyticsPolicy: sharedAnalyticsPolicy,
    howToUse: config.howToUse,
    formula: config.formula,
    workedExample: config.workedExample,
    resultInterpretation: config.resultInterpretation,
    edgeCases: config.edgeCases,
    faqs: config.faqs,
    privacyNote: config.privacyNote,
    disclaimer: config.disclaimer,
  };
}

const everydayPrivacy =
  'Inputs and results stay in this browser. Values are not sent to analytics, a backend, a URL or a log, and are not saved by default.';

const utilityDisclaimer =
  'This is a transparent local estimate. Verify assumptions and local definitions against your records before using the result for a commercial, contractual or operational decision.';

export const percentageTool = createUtilityTool<PercentageInput, PercentageResult>({
  id: 'percentage-calculator',
  slug: 'percentage-calculator',
  kind: 'calculator',
  ui: { adapter: 'utility-calculator', variant: 'percentage' },
  name: 'Percentage Calculator',
  shortName: 'Percentage',
  featured: true,
  launchPriority: 11,
  category: 'daily-utilities',
  categoryLabel: 'Everyday Utilities',
  secondaryCategories: [],
  tags: ['percentage', 'ratio', 'change', 'math'],
  searchTerms: ['percentage of a number', 'what percent is', 'percentage increase decrease'],
  summary:
    'Work out a percentage of a number, what percentage one value is of another, or percentage change.',
  riskTier: 'A',
  method: 'Decimal-safe percentage arithmetic with three explicit modes and formula substitution.',
  defaultValues: { mode: 'percentage-of', base: '1000', value: '200', percentage: '20' },
  inputSchema: percentageInputSchema,
  validate: validatePercentageInput,
  calculate: (input) => calculatePercentage(input),
  renderResult: (result) =>
    result.resultUnit === 'percentage' ? formatPercentage(result.result) : formatIndianNumber(result.result),
  limitations: [
    'The tool does not interpret the business meaning, tax treatment or unit behind a number.',
    'Percentage change uses the base value as its denominator.',
  ],
  seoTitle: 'Percentage Calculator | KarobarKit',
  seoDescription:
    'Calculate a percentage of a value, compare two values or measure percentage change locally.',
  relatedToolIds: ['discount-calculator', 'margin-calculator'],
  howToUse: [
    'Choose the question you want to answer.',
    'Enter the base and the required comparison or percentage value.',
    'Calculate to see the substituted formula and result.',
  ],
  formula: 'Percentage of = base × percentage ÷ 100; change = (new − base) ÷ base × 100',
  workedExample: '20% of ₹1,000 is ₹200. A move from ₹1,000 to ₹1,200 is a 20% increase.',
  resultInterpretation: 'A percentage is meaningful only when the base and units are clear.',
  edgeCases: [
    'A zero base is not accepted for percentage-of-change modes.',
    'Negative values are retained as entered so the direction is visible.',
  ],
  faqs: [
    {
      question: 'Does percentage change use the old value as the base?',
      answer: 'Yes. The original or base value is the denominator for percentage change.',
    },
  ],
  privacyNote: everydayPrivacy,
  disclaimer: utilityDisclaimer,
});

export const discountTool = createUtilityTool<DiscountInput, DiscountResult>({
  id: 'discount-calculator',
  slug: 'discount-calculator',
  kind: 'calculator',
  ui: { adapter: 'utility-calculator', variant: 'discount' },
  name: 'Discount Calculator',
  shortName: 'Discount',
  category: 'daily-utilities',
  categoryLabel: 'Everyday Utilities',
  secondaryCategories: ['ecommerce'],
  tags: ['discount', 'sale price', 'savings', 'pricing'],
  searchTerms: ['sale price calculator', 'successive discounts', 'effective discount'],
  summary:
    'Calculate savings and final price for one or two successive discounts without silently adding GST.',
  riskTier: 'A',
  method:
    'Apply each user-entered discount sequentially using decimal arithmetic; effective discount is measured against the original price.',
  capabilities: ['session-handoff'],
  defaultValues: { originalPrice: '1000', firstDiscountPercent: '10', secondDiscountPercent: '' },
  inputSchema: discountInputSchema,
  validate: validateDiscountInput,
  calculate: (input) => calculateDiscount(input),
  renderResult: (result) => formatIndianCurrency(result.finalPrice),
  limitations: [
    'GST, shipping, platform fees and coupons are not inferred or added.',
    'Successive percentage discounts are applied to the reduced price, not added together.',
  ],
  seoTitle: 'Discount Calculator | KarobarKit',
  seoDescription: 'Calculate sale price, savings and effective discount for one or two discounts locally.',
  relatedToolIds: ['percentage-calculator', 'pricing-calculator', 'gst-calculator'],
  howToUse: [
    'Enter the original price.',
    'Enter one discount and optionally a second successive discount.',
    'Review final price, savings and effective discount before an explicit handoff to another tool.',
  ],
  formula: 'Final price = original × (1 − discount 1 ÷ 100) × (1 − discount 2 ÷ 100)',
  workedExample:
    'A ₹1,000 item with 10% then 5% discounts costs ₹855; total savings are ₹145 and the effective discount is 14.5%.',
  resultInterpretation:
    'Two discounts of 10% and 5% are not a combined 15% reduction because the second applies after the first.',
  edgeCases: [
    'Discounts must be between 0% and 100%.',
    'The second discount can be left blank and is then treated as zero.',
  ],
  faqs: [
    {
      question: 'Does this add GST?',
      answer:
        'No. GST is deliberately outside this calculator and must be entered or reviewed explicitly in a GST-aware workflow.',
    },
  ],
  privacyNote: everydayPrivacy,
  disclaimer: utilityDisclaimer,
});

export const areaConverterTool = createUtilityTool<AreaInput, AreaResult>({
  id: 'area-converter',
  slug: 'area-converter',
  kind: 'calculator',
  ui: { adapter: 'utility-calculator', variant: 'area' },
  name: 'Area Converter',
  shortName: 'Area',
  category: 'daily-utilities',
  categoryLabel: 'Everyday Utilities',
  secondaryCategories: [],
  tags: ['area', 'land', 'square feet', 'acre', 'bigha', 'katha'],
  searchTerms: ['square feet to square metre', 'acre converter', 'land unit converter'],
  summary: 'Convert common area units and show an explicit regional definition when bigha or katha is used.',
  riskTier: 'B',
  method:
    'Convert through square metres using declared standard factors and selected reference factors for regional land units.',
  defaultValues: { value: '1', fromUnit: 'sqm', toUnit: 'sqft', region: 'north-india' },
  inputSchema: areaInputSchema,
  validate: validateAreaInput,
  calculate: (input) => calculateArea(input),
  renderResult: (result) => formatIndianNumber(result.convertedValue),
  limitations: [
    'Bigha and katha vary by locality and records; the selected reference is not a legal land measurement.',
    'Conversion does not validate a title, survey or property document.',
  ],
  seoTitle: 'Area Converter for Indian Units | KarobarKit',
  seoDescription:
    'Convert square feet, square metres, acres and region-defined Indian land units with visible assumptions.',
  relatedToolIds: ['percentage-calculator'],
  howToUse: [
    'Enter an area and choose the source and destination units.',
    'Select a regional definition if bigha or katha is involved.',
    'Review the factor and regional warning alongside the converted value.',
  ],
  formula: 'Converted area = input area × source-unit square metres ÷ destination-unit square metres',
  workedExample:
    '1 square metre converts to 10.7639 square feet using the standard international conversion factor.',
  resultInterpretation:
    'The factor is reversible, but region-defined units should be checked against the relevant local record.',
  edgeCases: [
    'Negative areas are rejected.',
    'A regional selection is required whenever bigha or katha is the source or destination.',
  ],
  faqs: [
    {
      question: 'Why do bigha conversions differ online?',
      answer:
        'Bigha and related units vary by state and locality. This tool requires a named reference and shows a warning instead of pretending there is one universal value.',
    },
  ],
  privacyNote: everydayPrivacy,
  disclaimer: utilityDisclaimer,
});

export const businessDaysTool = createUtilityTool<BusinessDaysInput, BusinessDaysResult>({
  id: 'business-days-calculator',
  slug: 'business-days-calculator',
  kind: 'calculator',
  ui: { adapter: 'utility-calculator', variant: 'business-days' },
  name: 'Business Days Calculator',
  shortName: 'Business Days',
  category: 'daily-utilities',
  categoryLabel: 'Everyday Utilities',
  secondaryCategories: ['hr-salary'],
  tags: ['business days', 'working days', 'date difference', 'weekends'],
  searchTerms: ['working days between dates', 'exclude weekends', 'holiday calculator'],
  summary:
    'Count business days between two dates with explicit boundary, weekend and versioned holiday settings.',
  riskTier: 'B',
  method:
    'Iterate the selected inclusive date range in UTC, excluding the configured weekend pattern and named holiday dates.',
  defaultValues: {
    startDate: '2026-08-10',
    endDate: '2026-08-14',
    includeStart: true,
    includeEnd: true,
    weekendPattern: 'saturday-sunday',
    holidayPreset: 'none',
    customHolidays: '',
  },
  inputSchema: businessDaysInputSchema,
  validate: validateBusinessDaysInput,
  calculate: (input) => calculateBusinessDays(input),
  renderResult: (result) => `${formatIndianNumber(result.businessDays)} business days`,
  limitations: [
    'The default is weekends only; public, bank and regional holidays are not inferred.',
    'Holiday presets are reference lists and should be reviewed for the relevant location and year.',
  ],
  seoTitle: 'Business Days Calculator | KarobarKit',
  seoDescription:
    'Count working days between dates with explicit weekend, inclusion and versioned holiday settings.',
  relatedToolIds: ['area-converter'],
  howToUse: [
    'Choose the start and end dates and whether each boundary is included.',
    'Select a weekend pattern and optional versioned holiday preset.',
    'Review the count and excluded-date summary.',
  ],
  formula: 'Business days = included calendar dates − configured weekends − configured holidays',
  workedExample:
    'Monday 10 August through Friday 14 August 2026, inclusive, is 5 business days with weekends only.',
  resultInterpretation:
    'The excluded-day list makes the result auditable for payroll, delivery or planning use.',
  edgeCases: [
    'Same-day ranges can return zero or one depending on the boundary and weekend settings.',
    'Reversed dates are rejected rather than silently returning a negative count.',
    'Custom holidays use YYYY-MM-DD and can be separated by commas or new lines.',
  ],
  faqs: [
    {
      question: 'Are Indian public holidays included by default?',
      answer:
        'No. Weekends-only is the default. Choose a versioned reference preset or enter your own dates explicitly.',
    },
  ],
  privacyNote: everydayPrivacy,
  disclaimer: utilityDisclaimer,
});

export const fuelExpenseTool = createUtilityTool<FuelInput, FuelResult>({
  id: 'fuel-expense-calculator',
  slug: 'fuel-expense-calculator',
  kind: 'calculator',
  ui: { adapter: 'utility-calculator', variant: 'fuel-expense' },
  name: 'Fuel Expense Calculator',
  shortName: 'Fuel Expense',
  category: 'retail-logistics',
  categoryLabel: 'Retail & Logistics',
  secondaryCategories: ['ecommerce'],
  tags: ['fuel', 'petrol', 'diesel', 'delivery cost', 'mileage'],
  searchTerms: ['petrol cost calculator', 'delivery fuel cost', 'mileage expense'],
  summary: 'Estimate litres and fuel cost from distance, mileage, trips and a price you enter yourself.',
  riskTier: 'B',
  method:
    'Normalize distance to kilometres and mileage to km/L, then multiply litres by the user-entered fuel price and optional markup.',
  capabilities: ['session-handoff'],
  defaultValues: {
    distance: '100',
    distanceUnit: 'km',
    mileage: '15',
    mileageUnit: 'km-per-litre',
    fuelPricePerLitre: '100',
    trips: '1',
    markupPercent: '0',
  },
  inputSchema: fuelInputSchema,
  validate: validateFuelInput,
  calculate: (input) => calculateFuelExpense(input),
  renderResult: (result) => formatIndianCurrency(result.customerCost),
  limitations: [
    'Fuel price is user-entered and is not fetched from a station or provider.',
    'Traffic, idling, route changes, tolls and maintenance are outside the estimate.',
  ],
  seoTitle: 'Fuel Expense Calculator for Deliveries | KarobarKit',
  seoDescription:
    'Estimate delivery fuel litres, cost and customer charge from distance, mileage and fuel price.',
  relatedToolIds: ['volumetric-weight-calculator', 'pricing-calculator'],
  howToUse: [
    'Enter distance, units and expected mileage.',
    'Enter the current fuel price per litre and number of trips.',
    'Optionally add a declared markup to see a customer or trip charge.',
  ],
  formula: 'Litres = distance in km ÷ mileage in km/L × trips; cost = litres × fuel price',
  workedExample: '100 km at 15 km/L and ₹100/L uses 6.6667 litres and costs about ₹666.67 before markup.',
  resultInterpretation:
    'The customer cost is a declared scenario charge, not a guaranteed delivery expense or statutory rate.',
  edgeCases: [
    'Zero distance produces zero litres and cost.',
    'Zero mileage is rejected because it would divide by zero.',
    'Miles and miles-per-gallon are converted using explicit constants.',
  ],
  faqs: [
    {
      question: 'Does the calculator fetch live petrol prices?',
      answer: 'No. You enter the price so the estimate remains local and auditable.',
    },
  ],
  privacyNote: everydayPrivacy,
  disclaimer: utilityDisclaimer,
});

export const volumetricWeightTool = createUtilityTool<VolumetricWeightInput, VolumetricWeightResult>({
  id: 'volumetric-weight-calculator',
  slug: 'volumetric-weight-calculator',
  kind: 'calculator',
  ui: { adapter: 'utility-calculator', variant: 'volumetric-weight' },
  name: 'Volumetric Weight Calculator',
  shortName: 'Volumetric Weight',
  category: 'retail-logistics',
  categoryLabel: 'Retail & Logistics',
  secondaryCategories: ['ecommerce'],
  tags: ['volumetric weight', 'dimensional weight', 'shipping', 'packaging'],
  searchTerms: ['dimensional weight calculator', 'chargeable weight', 'courier volumetric'],
  summary: 'Compare dimensional and actual package weight with a visible, user-overridable divisor.',
  riskTier: 'B',
  method:
    'Convert dimensions to centimetres and actual weight to kilograms, then divide package volume by the declared divisor.',
  defaultValues: {
    length: '30',
    width: '20',
    height: '15',
    dimensionUnit: 'cm',
    actualWeight: '2',
    actualWeightUnit: 'kg',
    divisor: '5000',
  },
  inputSchema: volumetricWeightInputSchema,
  validate: validateVolumetricWeightInput,
  calculate: (input) => calculateVolumetricWeight(input),
  renderResult: (result) => `${formatIndianNumber(result.chargeableWeightKg, { decimals: 2 })} kg`,
  limitations: [
    'The carrier’s service-specific divisor, rounding and minimum charge remain authoritative.',
    'This tool does not fetch a courier tariff or create a shipping label.',
  ],
  seoTitle: 'Volumetric Weight Calculator | KarobarKit',
  seoDescription:
    'Calculate dimensional and chargeable shipment weight with visible dimensions, actual weight and divisor.',
  relatedToolIds: ['fuel-expense-calculator', 'cod-cost-calculator'],
  howToUse: [
    'Enter package dimensions and choose centimetres or inches.',
    'Enter actual weight and choose kilograms or pounds.',
    'Enter the divisor supplied by the carrier and compare both weights.',
  ],
  formula: 'Dimensional weight (kg) = length (cm) × width (cm) × height (cm) ÷ divisor',
  workedExample:
    'A 30 × 20 × 15 cm package with divisor 5,000 has dimensional weight 1.8 kg; with 2 kg actual weight, chargeable weight is 2 kg.',
  resultInterpretation:
    'Chargeable weight is the greater of dimensional and actual weight under this common comparison rule.',
  edgeCases: [
    'Dimensions and divisor must be greater than zero.',
    'Zero actual weight is allowed for an empty-package planning scenario.',
    'The divisor is never hidden or assumed from a carrier.',
  ],
  faqs: [
    {
      question: 'Can I use a different divisor?',
      answer: 'Yes. Enter the divisor stated by your carrier; the result makes that assumption visible.',
    },
  ],
  privacyNote: everydayPrivacy,
  disclaimer: utilityDisclaimer,
});

export const wordCharacterCounterTool = createUtilityTool<WordCounterInput, WordCounterResult>({
  id: 'word-character-counter',
  slug: 'word-character-counter',
  kind: 'calculator',
  ui: { adapter: 'text-utility', variant: 'word-counter' },
  name: 'Word and Character Counter',
  shortName: 'Word Counter',
  category: 'daily-utilities',
  categoryLabel: 'Everyday Utilities',
  secondaryCategories: [],
  tags: ['words', 'characters', 'text', 'writing'],
  searchTerms: ['word count', 'character count', 'Hindi word counter', 'line counter'],
  summary: 'Count words, characters, no-space characters, lines and paragraphs locally in the browser.',
  riskTier: 'A',
  method:
    'Use Unicode-aware word segmentation when available and count JavaScript code points for characters.',
  defaultValues: { text: '' },
  inputSchema: wordCounterInputSchema,
  validate: validateWordCounterInput,
  calculate: (input) => calculateWordCounter(input),
  renderResult: (result) => `${formatIndianNumber(result.words)} words`,
  limitations: [
    'Word boundaries depend on browser Unicode segmentation support.',
    'Text is not persisted, transmitted or copied automatically.',
  ],
  seoTitle: 'Word and Character Counter | KarobarKit',
  seoDescription: 'Count words, Unicode characters, lines and paragraphs locally without storing the text.',
  relatedToolIds: ['todo-checklist'],
  howToUse: [
    'Paste or type text into the local text area.',
    'Review the live counts.',
    'Clear the text when finished; nothing is saved by default.',
  ],
  formula: 'Words = Unicode word-like segments; characters = Unicode code points; lines = line breaks + 1',
  workedExample:
    'The sentence “नमस्ते दुनिया” is counted with Unicode-aware segmentation rather than ASCII-only matching.',
  resultInterpretation:
    'Use the counts as editing guidance; publishing systems may count tokens or grapheme clusters differently.',
  edgeCases: [
    'Empty text reports zero words, characters, lines and paragraphs.',
    'Emoji and combined Unicode marks are handled as code points, not guaranteed visible glyphs.',
  ],
  faqs: [
    {
      question: 'Is my text uploaded?',
      answer:
        'No. The counter runs locally and does not put the text in analytics, a URL or a server request.',
    },
  ],
  privacyNote:
    'Text remains in the browser memory for this page session. It is not sent to analytics, a backend, a URL or a log, and is not saved by default.',
  disclaimer: utilityDisclaimer,
});

export const passwordToolkitTool = createUtilityTool<PasswordToolkitInput, PasswordToolkitResult>({
  id: 'password-toolkit',
  slug: 'password-toolkit',
  kind: 'generator',
  generatorKind: 'sequence',
  ui: { adapter: 'text-utility', variant: 'password-toolkit' },
  name: 'Password Toolkit',
  shortName: 'Password',
  category: 'daily-utilities',
  categoryLabel: 'Everyday Utilities',
  secondaryCategories: [],
  tags: ['password', 'security', 'generator', 'strength'],
  searchTerms: ['secure password generator', 'password strength checker', 'random password'],
  summary:
    'Generate a password with Web Crypto or assess one locally with clearly labelled strength estimates.',
  riskTier: 'C',
  method:
    'Use Web Crypto random values for generation and a conservative character-set entropy estimate for local assessment.',
  defaultValues: {
    mode: 'generate',
    length: '16',
    includeLowercase: true,
    includeUppercase: true,
    includeNumbers: true,
    includeSymbols: true,
    strengthInput: '',
  },
  inputSchema: passwordToolkitInputSchema,
  validate: validatePasswordToolkitInput,
  calculate: (input) => calculatePasswordToolkit(input),
  renderResult: (result) => result.password ?? result.label,
  limitations: [
    'Strength is an estimate, not a guaranteed crack time or security certification.',
    'Generated passwords are not copied, saved, logged or sent anywhere automatically.',
  ],
  seoTitle: 'Password Toolkit | KarobarKit',
  seoDescription:
    'Generate passwords with Web Crypto or assess password strength locally without saving the input.',
  relatedToolIds: ['word-character-counter'],
  howToUse: [
    'Choose Generate or Assess locally.',
    'For generation, choose length and character groups; for assessment, enter a password only when ready.',
    'Review the estimate and handle the generated value using your own secure password manager.',
  ],
  formula: 'Estimated entropy ≈ password length × log₂(character pool size)',
  workedExample:
    'A 16-character password using lowercase, uppercase, numbers and symbols has a higher estimated search space than a short lowercase-only password.',
  resultInterpretation:
    'A strength label is a rough signal. Unique passwords and a password manager matter more than a label alone.',
  edgeCases: [
    'At least one character group is required for generation.',
    'If Web Crypto is unavailable, the tool reports an honest error instead of falling back to Math.random.',
    'The assessment input is never placed in analytics or the URL.',
  ],
  faqs: [
    {
      question: 'Does the generator use secure randomness?',
      answer: 'It requires the browser Web Crypto API and does not fall back to an insecure random source.',
    },
  ],
  privacyNote:
    'Password values remain in browser memory only. They are never sent to analytics, a backend, a URL or a log, never persisted, and never auto-copied.',
  disclaimer:
    'Use a reputable password manager and multi-factor authentication. This estimate is educational and does not guarantee account security.',
});

export const todoChecklistTool = createUtilityTool<TodoInput, TodoChecklistResult>({
  id: 'todo-checklist',
  slug: 'todo-checklist',
  kind: 'worksheet',
  generatorKind: 'document',
  ui: { adapter: 'todo-checklist' },
  name: 'To-do Checklist',
  shortName: 'Checklist',
  category: 'daily-utilities',
  categoryLabel: 'Everyday Utilities',
  secondaryCategories: [],
  tags: ['todo', 'checklist', 'tasks', 'productivity'],
  searchTerms: ['task checklist', 'printable todo list', 'priority checklist'],
  summary:
    'Create a lightweight checklist in memory with priorities, progress, print and explicit CSV export.',
  riskTier: 'B',
  method: 'Keep task state in the active page session and derive progress from completed task records.',
  capabilities: ['download-csv', 'download-pdf', 'print-a4'],
  defaultValues: { tasks: [] },
  inputSchema: todoInputSchema,
  validate: validateTodoInput,
  calculate: (input) => calculateTodoChecklist(input),
  renderResult: (result) => `${formatIndianNumber(result.progressPercent, { decimals: 2 })}% complete`,
  limitations: [
    'Tasks are memory-first and disappear when the page is closed or refreshed.',
    'Export is a user-triggered local action; no task is synchronized to an account or backend.',
  ],
  seoTitle: 'To-do Checklist | KarobarKit',
  seoDescription: 'Build a private local checklist with priority, progress, print and explicit CSV export.',
  relatedToolIds: ['word-character-counter'],
  howToUse: [
    'Add a short task and choose its priority.',
    'Mark tasks complete as work progresses.',
    'Print or export only when you explicitly choose the local action.',
  ],
  formula: 'Progress = completed tasks ÷ total tasks × 100',
  workedExample: 'Three tasks with two completed show 66.67% progress and one remaining task.',
  resultInterpretation:
    'The checklist is a lightweight session worksheet, not a durable project-management system.',
  edgeCases: [
    'An empty checklist reports zero progress rather than 100%.',
    'Tasks are limited to 240 characters and 200 rows to keep the page responsive.',
  ],
  faqs: [
    {
      question: 'Are tasks saved?',
      answer: 'No. The first release is memory-first. Print or export a copy if you want to keep it.',
    },
  ],
  privacyNote:
    'Tasks remain in this browser session. They are not sent to analytics, a backend, a URL or a log, and no persistence is enabled by default.',
  disclaimer: utilityDisclaimer,
});

export const everydayUtilityTools = [
  percentageTool,
  discountTool,
  areaConverterTool,
  businessDaysTool,
  fuelExpenseTool,
  volumetricWeightTool,
  wordCharacterCounterTool,
  passwordToolkitTool,
  todoChecklistTool,
] as const;
