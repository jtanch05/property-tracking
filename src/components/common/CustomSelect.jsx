import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import './CustomSelect.css';

/**
 * CustomSelect — fully styled dropdown replacing native <select>.
 *
 * Props:
 *   value:        current selected value (string)
 *   onChange:     (value: string) => void
 *   options:      [{ value: string, label: string }] or [string] for simple lists
 *   placeholder:  string shown when no value selected
 *   variant:      'form' (default, rounded-md) | 'filter' (pill-shaped)
 *   disabled:     boolean
 *   required:     boolean (no-op, for future use)
 *   className:    extra class for trigger
 */
export default function CustomSelect({
    value,
    onChange,
    options = [],
    placeholder = 'Select...',
    variant = 'form',
    disabled = false,
    className = '',
}) {
    const [open, setOpen] = useState(false);
    const ref = useRef(null);

    // Normalise options to { value, label }
    const normalised = options.map(o =>
        typeof o === 'string' ? { value: o, label: o } : o
    );

    const selected = normalised.find(o => o.value === value);

    // Close on click-outside
    useEffect(() => {
        function handleOutside(e) {
            if (ref.current && !ref.current.contains(e.target)) setOpen(false);
        }
        document.addEventListener('mousedown', handleOutside);
        return () => document.removeEventListener('mousedown', handleOutside);
    }, []);

    // Close on Escape
    useEffect(() => {
        function handleKey(e) {
            if (e.key === 'Escape') setOpen(false);
        }
        document.addEventListener('keydown', handleKey);
        return () => document.removeEventListener('keydown', handleKey);
    }, []);

    function handleSelect(val) {
        onChange(val);
        setOpen(false);
    }

    return (
        <div ref={ref} className={`cs-wrapper cs-${variant} ${className}`}>
            <button
                type="button"
                className={`cs-trigger ${open ? 'cs-open' : ''} ${disabled ? 'cs-disabled' : ''}`}
                onClick={() => !disabled && setOpen(o => !o)}
                aria-haspopup="listbox"
                aria-expanded={open}
            >
                <span className={`cs-value ${!selected ? 'cs-placeholder' : ''}`}>
                    {selected ? selected.label : placeholder}
                </span>
                <ChevronDown size={15} className={`cs-chevron ${open ? 'cs-chevron-up' : ''}`} />
            </button>

            {open && (
                <div className="cs-panel" role="listbox">
                    {normalised.map(opt => (
                        <div
                            key={opt.value}
                            role="option"
                            aria-selected={opt.value === value}
                            className={`cs-option ${opt.value === value ? 'cs-selected' : ''}`}
                            onMouseDown={() => handleSelect(opt.value)}
                        >
                            {opt.label}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
