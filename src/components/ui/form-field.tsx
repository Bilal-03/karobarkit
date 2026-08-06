import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react';

interface FieldShellProps {
  id: string;
  label: string;
  help?: ReactNode;
  error?: string;
  required?: boolean;
  children: ReactNode;
}

function FieldShell({ id, label, help, error, required, children }: FieldShellProps) {
  return (
    <div className="field">
      <label className="field__label" htmlFor={id}>
        {label}
        {required ? <span aria-hidden="true"> *</span> : null}
      </label>
      {children}
      {help ? (
        <div className="field__help" id={`${id}-help`}>
          {help}
        </div>
      ) : null}
      {error ? (
        <div className="field__error" id={`${id}-error`} role="alert">
          {error}
        </div>
      ) : null}
    </div>
  );
}

interface InputFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  help?: ReactNode;
  error?: string;
}

export function InputField({ id, label, help, error, required, ...props }: InputFieldProps) {
  const describedBy =
    [help ? `${id}-help` : '', error ? `${id}-error` : ''].filter(Boolean).join(' ') || undefined;
  return (
    <FieldShell id={id ?? ''} label={label} help={help} error={error} required={required}>
      <input
        id={id}
        className={`input${error ? ' input--error' : ''}`}
        aria-invalid={Boolean(error)}
        aria-describedby={describedBy}
        required={required}
        {...props}
      />
    </FieldShell>
  );
}

interface SelectFieldProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  help?: ReactNode;
  error?: string;
}

export function SelectField({ id, label, help, error, required, children, ...props }: SelectFieldProps) {
  const describedBy =
    [help ? `${id}-help` : '', error ? `${id}-error` : ''].filter(Boolean).join(' ') || undefined;
  return (
    <FieldShell id={id ?? ''} label={label} help={help} error={error} required={required}>
      <select
        id={id}
        className={`input input--select${error ? ' input--error' : ''}`}
        aria-invalid={Boolean(error)}
        aria-describedby={describedBy}
        required={required}
        {...props}
      >
        {children}
      </select>
    </FieldShell>
  );
}

interface TextareaFieldProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  help?: ReactNode;
  error?: string;
}

export function TextareaField({ id, label, help, error, required, ...props }: TextareaFieldProps) {
  const describedBy =
    [help ? `${id}-help` : '', error ? `${id}-error` : ''].filter(Boolean).join(' ') || undefined;
  return (
    <FieldShell id={id ?? ''} label={label} help={help} error={error} required={required}>
      <textarea
        id={id}
        className={`input input--textarea${error ? ' input--error' : ''}`}
        aria-invalid={Boolean(error)}
        aria-describedby={describedBy}
        required={required}
        {...props}
      />
    </FieldShell>
  );
}

interface CheckboxFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  help?: ReactNode;
  error?: string;
}

export function CheckboxField({ id, label, help, error, ...props }: CheckboxFieldProps) {
  return (
    <div className="choice-field">
      <label className="choice-field__label" htmlFor={id}>
        <input
          id={id}
          type="checkbox"
          className="choice-field__control"
          aria-invalid={Boolean(error)}
          {...props}
        />
        <span>{label}</span>
      </label>
      {help ? <div className="field__help">{help}</div> : null}
      {error ? (
        <div className="field__error" role="alert">
          {error}
        </div>
      ) : null}
    </div>
  );
}

interface RadioOption {
  value: string;
  label: string;
}

interface RadioGroupProps {
  id?: string;
  name: string;
  label: string;
  options: RadioOption[];
  value: string;
  onChange: (value: string) => void;
  help?: ReactNode;
  error?: string;
}

export function RadioGroup({ id, name, label, options, value, onChange, help, error }: RadioGroupProps) {
  const describedBy =
    [help ? `${id ?? name}-help` : '', error ? `${id ?? name}-error` : ''].filter(Boolean).join(' ') ||
    undefined;
  return (
    <fieldset
      id={id}
      className={`radio-group${error ? ' radio-group--error' : ''}`}
      aria-invalid={Boolean(error)}
      aria-describedby={describedBy}
    >
      <legend className="field__label">{label}</legend>
      {help ? (
        <div className="field__help" id={`${id ?? name}-help`}>
          {help}
        </div>
      ) : null}
      <div className="radio-group__options">
        {options.map((option) => (
          <label className="radio-option" key={option.value}>
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={value === option.value}
              onChange={() => onChange(option.value)}
            />
            <span>{option.label}</span>
          </label>
        ))}
      </div>
      {error ? (
        <div className="field__error" id={`${id ?? name}-error`} role="alert">
          {error}
        </div>
      ) : null}
    </fieldset>
  );
}
