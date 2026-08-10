import React, { useEffect, useRef, useState } from 'react';
import './ThemedSelect.css';

export interface ThemedSelectOption {
  value: string;
  label: string;
}

interface ThemedSelectProps {
  value: string;
  options: ThemedSelectOption[];
  onChange: (value: string) => void;
  className?: string;
  title?: string;
}

/**
 * A dropdown that looks the same everywhere. Native <select> elements
 * render their open dropdown list using the OS/browser's own widget on
 * many platforms (notably Windows Chromium) — CSS on <option> is often
 * silently ignored there regardless of what's set, so a themed page ends
 * up with a plain white popup no matter what. This renders the open list
 * ourselves instead, so it's actually themeable.
 */
export const ThemedSelect: React.FC<ThemedSelectProps> = ({ value, options, onChange, className, title }) => {
  const [isOpen, setIsOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const selected = options.find((o) => o.value === value);

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

  return (
    <div className={`themed-select${className ? ` ${className}` : ''}`} ref={rootRef} title={title}>
      <button
        type="button"
        className="themed-select__trigger"
        onClick={(e) => { e.stopPropagation(); setIsOpen((o) => !o); }}
      >
        <span>{selected?.label ?? value}</span>
        <span className={`themed-select__caret${isOpen ? ' themed-select__caret--open' : ''}`}>▾</span>
      </button>
      {isOpen && (
        <div className="themed-select__menu" role="listbox">
          {options.map((opt) => (
            <div
              key={opt.value}
              role="option"
              aria-selected={opt.value === value}
              className={`themed-select__option${opt.value === value ? ' themed-select__option--selected' : ''}`}
              onClick={() => { onChange(opt.value); setIsOpen(false); }}
            >
              {opt.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
