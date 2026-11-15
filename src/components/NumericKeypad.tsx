import React, { useEffect, useCallback } from 'react';
import { CornerDownLeft, Delete } from 'lucide-react';

export interface NumericKeypadProps {
  value: string;
  onChange: (next: string) => void;
  onSubmit: () => void;
  allowDecimal?: boolean;
  disabled?: boolean;
  unit?: string;
}

export const NumericKeypad: React.FC<NumericKeypadProps> = ({
  value,
  onChange,
  onSubmit,
  allowDecimal = false,
  disabled = false,
  unit,
}) => {
  const handleDigit = useCallback(
    (digit: string) => {
      if (disabled) return;
      if (value.length >= 10) return;

      if (value === '0') {
        onChange(digit);
      } else {
        onChange(value + digit);
      }
    },
    [value, disabled, onChange],
  );

  const handleDecimal = useCallback(() => {
    if (disabled || !allowDecimal) return;
    if (value.includes('.')) return;

    if (value === '') {
      onChange('0.');
    } else {
      onChange(value + '.');
    }
  }, [value, disabled, allowDecimal, onChange]);

  const handleBackspace = useCallback(() => {
    if (disabled) return;
    onChange(value.slice(0, -1));
  }, [value, disabled, onChange]);

  const handleClear = useCallback(() => {
    if (disabled) return;
    onChange('');
  }, [disabled, onChange]);

  const handleSubmit = useCallback(() => {
    if (disabled || value.trim() === '') return;
    onSubmit();
  }, [disabled, value, onSubmit]);

  useEffect(() => {
    if (disabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      if (e.key >= '0' && e.key <= '9') {
        e.preventDefault();
        handleDigit(e.key);
      } else if (e.key === '.' || e.key === ',') {
        e.preventDefault();
        if (allowDecimal) {
          handleDecimal();
        }
      } else if (e.key === 'Backspace') {
        e.preventDefault();
        handleBackspace();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        handleClear();
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (value.trim() !== '') {
          handleSubmit();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    disabled,
    allowDecimal,
    value,
    handleDigit,
    handleDecimal,
    handleBackspace,
    handleClear,
    handleSubmit,
  ]);

  const isSubmitDisabled = disabled || value.trim() === '';

  return (
    <div className="w-full max-w-sm mx-auto flex flex-col gap-3">
      {/* Answer Display */}
      <div className="w-full min-h-16 px-4 py-3 bg-zinc-900/90 border border-zinc-800 rounded-2xl flex items-center justify-between shadow-inner">
        <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider select-none">
          Resposta
        </span>
        <div className="flex items-center gap-2 overflow-hidden">
          <span
            className={`font-mono text-2xl sm:text-3xl font-bold tracking-wider ${
              value ? 'text-cyan-400' : 'text-zinc-600'
            }`}
          >
            {value || '0'}
          </span>
          {unit && (
            <span className="px-2 py-0.5 bg-cyan-950/60 border border-cyan-800/60 text-cyan-300 text-xs font-semibold rounded-md select-none">
              {unit}
            </span>
          )}
        </div>
      </div>

      {/* Keypad Grid */}
      <div className="grid grid-cols-3 gap-2 select-none">
        {/* Row 1 */}
        {['1', '2', '3'].map((digit) => (
          <button
            key={digit}
            type="button"
            disabled={disabled}
            onClick={() => handleDigit(digit)}
            className="min-h-12 sm:min-h-14 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-100 font-mono text-xl sm:text-2xl font-semibold shadow-sm transition-all duration-75 active:scale-95 hover:bg-zinc-800 hover:border-zinc-700 disabled:opacity-40 disabled:pointer-events-none flex items-center justify-center cursor-pointer"
          >
            {digit}
          </button>
        ))}

        {/* Row 2 */}
        {['4', '5', '6'].map((digit) => (
          <button
            key={digit}
            type="button"
            disabled={disabled}
            onClick={() => handleDigit(digit)}
            className="min-h-12 sm:min-h-14 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-100 font-mono text-xl sm:text-2xl font-semibold shadow-sm transition-all duration-75 active:scale-95 hover:bg-zinc-800 hover:border-zinc-700 disabled:opacity-40 disabled:pointer-events-none flex items-center justify-center cursor-pointer"
          >
            {digit}
          </button>
        ))}

        {/* Row 3 */}
        {['7', '8', '9'].map((digit) => (
          <button
            key={digit}
            type="button"
            disabled={disabled}
            onClick={() => handleDigit(digit)}
            className="min-h-12 sm:min-h-14 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-100 font-mono text-xl sm:text-2xl font-semibold shadow-sm transition-all duration-75 active:scale-95 hover:bg-zinc-800 hover:border-zinc-700 disabled:opacity-40 disabled:pointer-events-none flex items-center justify-center cursor-pointer"
          >
            {digit}
          </button>
        ))}

        {/* Row 4 */}
        <button
          type="button"
          disabled={disabled || !allowDecimal}
          onClick={handleDecimal}
          className={`min-h-12 sm:min-h-14 rounded-xl border font-mono text-xl sm:text-2xl font-semibold shadow-sm transition-all duration-75 flex items-center justify-center ${
            allowDecimal
              ? 'bg-zinc-900 border-zinc-800 text-zinc-100 active:scale-95 hover:bg-zinc-800 hover:border-zinc-700 cursor-pointer'
              : 'bg-zinc-950 border-zinc-900 text-zinc-700 cursor-not-allowed opacity-30'
          }`}
        >
          .
        </button>

        <button
          type="button"
          disabled={disabled}
          onClick={() => handleDigit('0')}
          className="min-h-12 sm:min-h-14 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-100 font-mono text-xl sm:text-2xl font-semibold shadow-sm transition-all duration-75 active:scale-95 hover:bg-zinc-800 hover:border-zinc-700 disabled:opacity-40 disabled:pointer-events-none flex items-center justify-center cursor-pointer"
        >
          0
        </button>

        <button
          type="button"
          disabled={disabled || value === ''}
          onClick={handleBackspace}
          aria-label="Apagar último caractere"
          className="min-h-12 sm:min-h-14 rounded-xl bg-zinc-900/80 border border-zinc-800 text-zinc-300 shadow-sm transition-all duration-75 active:scale-95 hover:bg-zinc-800 hover:text-zinc-100 disabled:opacity-30 disabled:pointer-events-none flex items-center justify-center cursor-pointer"
        >
          <Delete className="w-5 h-5" />
        </button>

        {/* Row 5: Clear and Confirm */}
        <button
          type="button"
          disabled={disabled || value === ''}
          onClick={handleClear}
          className="min-h-12 sm:min-h-14 rounded-xl bg-zinc-900/80 border border-zinc-800 text-zinc-400 font-semibold text-sm transition-all duration-75 active:scale-95 hover:bg-zinc-800 hover:text-zinc-200 disabled:opacity-30 disabled:pointer-events-none flex items-center justify-center cursor-pointer"
        >
          Limpar
        </button>

        <button
          type="button"
          disabled={isSubmitDisabled}
          onClick={handleSubmit}
          className="col-span-2 min-h-12 sm:min-h-14 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-zinc-950 font-bold text-base sm:text-lg shadow-lg shadow-cyan-950/50 transition-all duration-75 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none flex items-center justify-center gap-2 cursor-pointer"
        >
          <span>Confirmar</span>
          <CornerDownLeft className="w-5 h-5 stroke-[2.5]" />
        </button>
      </div>
    </div>
  );
};
