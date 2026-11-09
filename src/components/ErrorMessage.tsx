import React from 'react';
import { AlertCircle, X } from 'lucide-react';
import { ApiErrorPayload } from '../types';

interface ErrorMessageProps {
  error: ApiErrorPayload['error'] | string | null;
  onDismiss?: () => void;
  className?: string;
}

export const ErrorMessage: React.FC<ErrorMessageProps> = ({ error, onDismiss, className = '' }) => {
  if (!error) return null;

  const isString = typeof error === 'string';
  const code = !isString ? error.code : undefined;
  const message = isString ? error : error.message;
  const fields = !isString ? error.fields : undefined;

  return (
    <div
      role="alert"
      className={`rounded-xl border border-red-200 bg-red-50/90 p-4 text-sm text-red-900 shadow-sm ${className}`}
    >
      <div className="flex items-start gap-3">
        <AlertCircle className="h-5 w-5 flex-shrink-0 text-red-600 mt-0.5" />
        <div className="flex-1">
          {code && (
            <div className="text-xs font-semibold uppercase tracking-wider text-red-700">
              Error ({code})
            </div>
          )}
          <p className="font-medium text-red-950 mt-0.5">{message}</p>

          {fields && Object.keys(fields).length > 0 && (
            <ul className="mt-2 list-disc list-inside space-y-0.5 text-xs text-red-800">
              {Object.entries(fields).map(([fKey, fVal]) => (
                <li key={fKey}>
                  <span className="font-semibold">{fKey}:</span> {fVal}
                </li>
              ))}
            </ul>
          )}
        </div>

        {onDismiss && (
          <button
            type="button"
            onClick={onDismiss}
            className="text-red-500 hover:text-red-700 p-1 -mr-1 -mt-1 rounded-lg"
            title="Dismiss error"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
};
