import React, { useEffect, useRef, useState } from 'react';
import './ThemedDatePicker.css';

interface ThemedDatePickerProps {
  /** YYYY-MM-DD, or '' for no date selected — same format a native <input type="date"> uses. */
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

const WEEKDAY_LABELS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

function toDateOnly(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function parseDateOnly(value: string): Date | null {
  if (!value) return null;
  const [y, m, d] = value.split('-').map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
}

/**
 * A date field that looks the same everywhere. Native <input type="date">
 * opens the OS/browser's own calendar popup, which can't be restyled — on
 * Windows Chromium it's a plain white/light widget regardless of the page's
 * theme. This renders its own calendar grid instead, same approach as
 * ThemedSelect for the same reason.
 */
export const ThemedDatePicker: React.FC<ThemedDatePickerProps> = ({ value, onChange, placeholder, className }) => {
  const [isOpen, setIsOpen] = useState(false);
  const selected = parseDateOnly(value);
  const [viewMonth, setViewMonth] = useState(() => selected || new Date());
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) setViewMonth(selected || new Date());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setIsOpen(false);
    };
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  const year = viewMonth.getFullYear();
  const month = viewMonth.getMonth();
  const firstOfMonth = new Date(year, month, 1);
  const startWeekday = firstOfMonth.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date();
  const todayKey = toDateOnly(today);

  const cells: (number | null)[] = [
    ...Array(startWeekday).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  const monthLabel = viewMonth.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
  const displayLabel = selected
    ? selected.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
    : placeholder || 'Select date';

  const pick = (day: number) => {
    onChange(toDateOnly(new Date(year, month, day)));
    setIsOpen(false);
  };

  return (
    <div className={`themed-date${className ? ` ${className}` : ''}`} ref={rootRef}>
      <button
        type="button"
        className="themed-date__trigger"
        onClick={(e) => { e.stopPropagation(); setIsOpen((o) => !o); }}
      >
        <span className={selected ? '' : 'themed-date__trigger-placeholder'}>{displayLabel}</span>
        <span className="themed-date__icon">📅</span>
      </button>
      {isOpen && (
        <div className="themed-date__panel" role="dialog">
          <div className="themed-date__header">
            <button type="button" className="themed-date__nav" onClick={() => setViewMonth(new Date(year, month - 1, 1))}>‹</button>
            <span className="themed-date__month-label">{monthLabel}</span>
            <button type="button" className="themed-date__nav" onClick={() => setViewMonth(new Date(year, month + 1, 1))}>›</button>
          </div>
          <div className="themed-date__weekdays">
            {WEEKDAY_LABELS.map((w) => (
              <span key={w}>{w}</span>
            ))}
          </div>
          <div className="themed-date__grid">
            {cells.map((day, i) => {
              if (day === null) return <span key={`blank-${i}`} className="themed-date__cell themed-date__cell--blank" />;
              const key = toDateOnly(new Date(year, month, day));
              const isSelected = key === value;
              const isToday = key === todayKey;
              return (
                <button
                  key={key}
                  type="button"
                  className={`themed-date__cell${isSelected ? ' themed-date__cell--selected' : ''}${isToday && !isSelected ? ' themed-date__cell--today' : ''}`}
                  onClick={() => pick(day)}
                >
                  {day}
                </button>
              );
            })}
          </div>
          <div className="themed-date__footer">
            <button type="button" className="themed-date__footer-btn" onClick={() => { onChange(toDateOnly(today)); setIsOpen(false); }}>
              Today
            </button>
            {value && (
              <button type="button" className="themed-date__footer-btn" onClick={() => { onChange(''); setIsOpen(false); }}>
                Clear
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
