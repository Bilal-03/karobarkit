'use client';
import { useState } from 'react';
import Link from 'next/link';
import {
  compareScenario,
  exampleScenario,
  readWorkspace,
  writeWorkspace,
  type Scenario,
} from '@/domain/workspace';
import { formatIndianCurrency } from '@/domain/formatting/indian';
const labels = {
  name: 'Scenario name',
  price: 'Price per unit',
  cost: 'Other variable cost per unit',
  delivery: 'Delivery cost per unit',
  discount: 'Discount %',
  units: 'Expected units per period',
  fixed: 'Fixed costs per period',
};
export function DecisionWorkbench() {
  const [scenarios, setScenarios] = useState<Scenario[]>([{ ...exampleScenario }]);
  const [message, setMessage] = useState('');
  const outputs = scenarios.map((s) => {
    try {
      return { result: compareScenario(s), error: '' };
    } catch (e) {
      return { result: null, error: e instanceof Error ? e.message : 'Check inputs.' };
    }
  });
  function action(fn: () => void) {
    try {
      fn();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Storage unavailable.');
    }
  }
  return (
    <div>
      <p>
        Compare up to three offers using the same period. Enter price before tax, variable costs including
        delivery, expected sales volume and fixed costs. Forecasts are your assumptions; the workbench does
        not predict demand or choose a winner.
      </p>
      <div className="inline-actions">
        <button
          className="button button--secondary"
          disabled={scenarios.length >= 3}
          onClick={() =>
            setScenarios([
              ...scenarios,
              { ...scenarios[scenarios.length - 1], name: `Alternative ${scenarios.length}` },
            ])
          }
        >
          Add alternative
        </button>
        <button
          className="button button--secondary"
          onClick={() =>
            action(() => {
              const saved = readWorkspace().scenarios;
              if (!saved.length) throw new Error('No saved comparisons.');
              if (window.confirm('Replace current scenarios with saved ones?')) setScenarios(saved);
            })
          }
        >
          Load saved comparisons
        </button>
        <button
          className="button button--secondary"
          disabled={outputs.some((o) => !o.result)}
          onClick={() =>
            action(() => {
              const w = readWorkspace();
              writeWorkspace({ ...w, scenarios });
              setMessage('Comparisons saved on this device only.');
            })
          }
        >
          Save comparisons on this device
        </button>{' '}
        <Link href="/workspace">Manage local workspace</Link>
      </div>
      <div className="tool-grid">
        {scenarios.map((s, i) => (
          <section className="content-card" key={i} aria-label={`Scenario ${i + 1}`}>
            <h2>Scenario {i + 1}</h2>
            {Object.entries(labels).map(([key, label]) => (
              <label className="field" key={key} htmlFor={`scenario-${i}-${key}`}>
                {label}
                <input
                  id={`scenario-${i}-${key}`}
                  className="input"
                  value={s[key as keyof Scenario]}
                  maxLength={key === 'name' ? 80 : 24}
                  inputMode={key === 'name' ? 'text' : 'decimal'}
                  onChange={(e) =>
                    setScenarios(
                      scenarios.map((row, j) => (j === i ? { ...row, [key]: e.target.value } : row)),
                    )
                  }
                />
              </label>
            ))}
            {scenarios.length > 1 && (
              <button onClick={() => setScenarios(scenarios.filter((_, j) => j !== i))}>
                Remove scenario
              </button>
            )}
            {outputs[i].error && <p role="alert">{outputs[i].error}</p>}
          </section>
        ))}
      </div>
      <h2>Compare outcomes</h2>
      <div style={{ overflowX: 'auto' }}>
        <table>
          <caption>Assumption-based comparison. All money in INR; totals use the entered period.</caption>
          <thead>
            <tr>
              <th scope="col">Metric</th>
              {scenarios.map((s, i) => (
                <th scope="col" key={i}>
                  {s.name || `Scenario ${i + 1}`}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(
              [
                'netPrice',
                'contribution',
                'revenue',
                'profit',
                'margin',
                'breakEven',
                'lowerVolumeProfit',
                'higherCostProfit',
              ] as const
            ).map((key) => (
              <tr key={key}>
                <th scope="row">
                  {
                    {
                      netPrice: 'Net price per unit',
                      contribution: 'Contribution per unit',
                      revenue: 'Period revenue',
                      profit: 'Profit after fixed costs',
                      margin: 'Contribution margin %',
                      breakEven: 'Break-even whole units',
                      lowerVolumeProfit: 'Profit if volume is 20% lower',
                      higherCostProfit: 'Profit if variable costs are 10% higher',
                    }[key]
                  }
                </th>
                {outputs.map((o, i) => (
                  <td key={i}>
                    {!o.result
                      ? 'Check inputs'
                      : o.result[key] === null
                        ? 'Not reachable'
                        : key === 'margin'
                          ? `${o.result[key]}%`
                          : key === 'breakEven'
                            ? o.result[key]
                            : formatIndianCurrency(o.result[key]!)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p>
        Net price = price × (1 − discount), rounded to paise. Contribution = net price − variable costs −
        delivery. Profit = contribution × units − fixed costs. Break-even uses the existing break-even
        calculator and is unavailable when contribution is zero or negative. The lower-volume case rounds
        units down; sensitivity cases change one assumption at a time.
      </p>
      <p className="notice">
        All scenarios exclude GST, income tax, working capital and financing. Use consistent units and
        periods. Review assumptions rather than treating the highest modeled profit as a recommendation.
        Nothing is saved until you choose Save.
      </p>
      <p role="status">{message}</p>
    </div>
  );
}
