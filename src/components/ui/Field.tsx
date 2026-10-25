import type { ReactNode } from 'react';

interface FieldProps {
  id: string;
  label: string;
  error?: string;
  hint?: ReactNode;
  required?: boolean;
  optional?: boolean;
  children: ReactNode;
  className?: string;
}

/** Label + control + hint + error, wired together for screen readers. */
export function Field({ id, label, error, hint, required, optional, children, className = '' }: FieldProps) {
  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1.5 block font-semibold text-charcoal-900">
        {label}
        {required && (
          <span className="text-cherry" aria-hidden="true">
            {' '}
            *
          </span>
        )}
        {optional && <span className="font-normal text-charcoal-600"> (optional)</span>}
      </label>
      {children}
      {hint && !error && (
        <p id={`${id}-hint`} className="mt-1 text-sm text-charcoal-600">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} className="mt-1 text-sm font-medium text-cherry" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

/** Visually hidden honeypot input to catch spam bots. */
export function Honeypot({ register }: { register: object }) {
  return (
    <div aria-hidden="true" style={{ position: 'absolute', left: '-10000px', width: 1, height: 1, overflow: 'hidden' }}>
      <label htmlFor="website">Leave this field empty</label>
      <input id="website" type="text" tabIndex={-1} autoComplete="off" {...register} />
    </div>
  );
}
