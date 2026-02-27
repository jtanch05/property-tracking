import React from 'react';
import './ToggleGroup.css';

/**
 * ToggleGroup — a segmented pill control replacing yes/no, active/inactive selects.
 *
 * Props:
 *   options: [{ value: string, label: string }]
 *   value: string (current selected value)
 *   onChange: (value: string) => void
 *   size?: 'sm' | 'md'
 */
export default function ToggleGroup({ options, value, onChange, size = 'md' }) {
    return (
        <div className={`toggle-group toggle-group-${size}`}>
            {options.map(opt => (
                <button
                    key={opt.value}
                    type="button"
                    className={`toggle-btn ${value === opt.value ? 'toggle-btn-active' : ''}`}
                    onClick={() => onChange(opt.value)}
                >
                    {opt.label}
                </button>
            ))}
        </div>
    );
}
