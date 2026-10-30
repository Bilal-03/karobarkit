import { writeFile } from 'node:fs/promises';

const endpoint = 'http://localhost:3001/api/ai/assist';
const scenarios = [
  {
    id: 'name-english',
    assistant: 'business-name',
    input: {
      businessType: 'Home-made healthy snacks', location: 'Pune', language: 'english',
      tone: 'modern', keywords: 'fresh, local', avoid: 'instant',
    },
  },
  {
    id: 'pricing-standard',
    assistant: 'pricing-assistant',
    input: {
      productName: 'Handmade soap', unitCost: '600', targetMargin: '40',
      discountPercent: '10', taxRate: '18', channelFeePercent: '5', shippingCost: '20',
      notes: 'Consider a launch discount for Indian customers.',
    },
  },
  {
    id: 'startup-original-regression',
    assistant: 'startup-cost-estimator',
    input: {
      businessType: 'Food brand', location: 'Pune',
      oneTimeCosts: 'Equipment: 50000\nBranding: 15000',
      monthlyCosts: 'Rent: 25000\nPeople: 40000\nSoftware: 5000',
      runwayMonths: '6', contingencyPercent: '10',
    },
    expectedFunding: '533500',
  },
  {
    id: 'plan-food',
    assistant: 'business-plan-assistant',
    input: {
      businessName: 'FreshBox Foods', industry: 'Food and beverage',
      targetCustomer: 'Busy office workers', problem: 'Healthy snacks are hard to order during workdays.',
      solution: 'Weekly snack boxes delivered to offices.', region: 'Bengaluru',
      revenueModel: 'Monthly subscription', firstYearGoal: 'Reach 100 recurring customers',
      milestones: 'Pilot, repeat-order test, local launch', constraints: 'Limited founder budget',
    },
  },
  {
    id: 'name-hindi',
    assistant: 'business-name',
    input: {
      businessType: 'घर पर बने मसाले', location: 'जयपुर', language: 'hindi',
      tone: 'trustworthy', keywords: 'घरेलू, स्वाद', avoid: 'विदेशी शब्द',
    },
  },
  {
    id: 'pricing-indian-grouping',
    assistant: 'pricing-assistant',
    input: {
      productName: 'Craft equipment', unitCost: '1,00,000', targetMargin: '20',
      discountPercent: '0', taxRate: '0', channelFeePercent: '0', shippingCost: '0', notes: '',
    },
  },
  {
    id: 'startup-indian-grouping',
    assistant: 'startup-cost-estimator',
    input: {
      businessType: 'Repair service', location: 'Jaipur',
      oneTimeCosts: 'Equipment: 1,00,000\nBranding: 25,000',
      monthlyCosts: 'Rent: 30,000\nStaff: 70,000',
      runwayMonths: '3', contingencyPercent: '5',
    },
    expectedFunding: '446250',
  },
  {
    id: 'plan-tailoring',
    assistant: 'business-plan-assistant',
    input: {
      businessName: 'Seher Stitch', industry: 'Tailoring services',
      targetCustomer: 'Local families seeking clothing alterations',
      problem: 'Customers need reliable alterations near home.',
      solution: 'Appointment-based tailoring and alterations.', region: 'Lucknow',
      revenueModel: 'Service fee per order', firstYearGoal: 'Build repeat local demand',
      milestones: 'Pilot with neighbours, collect feedback, refine appointment slots',
      constraints: 'No shop lease; founder works from a home studio.',
    },
  },
  {
    id: 'name-hinglish-rate-limit-probe',
    assistant: 'business-name',
    input: {
      businessType: 'Local cycle repair', location: 'Delhi', language: 'hinglish',
      tone: 'playful', keywords: 'cycle, saathi', avoid: '',
    },
  },
];

const results = [];
for (const scenario of scenarios) {
  const started = Date.now();
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ assistant: scenario.assistant, input: scenario.input, consent: true }),
  });
  const body = await response.json();
  const funding = body?.result?.metrics?.find((item) => item.label === 'Estimated funding for scenario')?.value;
  const record = {
    id: scenario.id, assistant: scenario.assistant, input: scenario.input,
    expectedFunding: scenario.expectedFunding, status: response.status,
    elapsedMs: Date.now() - started,
    remaining: response.headers.get('X-AI-RateLimit-Remaining'),
    providerAttempted: body.providerAttempted ?? false,
    fallbackReason: body.fallbackReason ?? null,
    provider: body.result?.provider ?? null,
    funding: funding ?? null,
    matchesExpectedFunding: scenario.expectedFunding ? funding === scenario.expectedFunding : null,
    response: body,
  };
  results.push(record);
  console.log(JSON.stringify({ id: record.id, status: record.status, provider: record.provider,
    fallbackReason: record.fallbackReason, remaining: record.remaining,
    matchesExpectedFunding: record.matchesExpectedFunding, elapsedMs: record.elapsedMs }));
  if (response.status === 429) break;
}
await writeFile(new URL('./live-ai-retest-results.json', import.meta.url), JSON.stringify(results, null, 2));
