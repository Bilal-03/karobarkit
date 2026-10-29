'use client';
import { useState } from 'react';
import { InputField } from './form-field';
export function DurationField({
  id,
  value,
  onChange,
  error,
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
}) {
  const [unit, setUnit] = useState<'months' | 'years'>('years');
  const shown =
    value === '' ? '' : unit === 'years' ? String(Number((Number(value) / 12).toFixed(6))) : value;
  return (
    <div className="duration-field">
      <InputField
        id={id}
        label="Duration"
        value={shown}
        inputMode="decimal"
        onChange={(event) =>
          onChange(
            unit === 'years' && event.target.value !== ''
              ? String(Number(event.target.value) * 12)
              : event.target.value,
          )
        }
        error={error}
        required
      />
      <label className="sr-only" htmlFor={`${id}-unit`}>
        Duration unit
      </label>
      <select
        id={`${id}-unit`}
        aria-label="Duration unit"
        value={unit}
        onChange={(event) => setUnit(event.target.value as 'months' | 'years')}
      >
        <option value="years">Years</option>
        <option value="months">Months</option>
      </select>
    </div>
  );
}
