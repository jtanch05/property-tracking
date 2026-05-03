import React from 'react';
import { cn } from '../../lib/utils';

const VARIANT_CLASS = {
    success: 'badge-success',
    warning: 'badge-warning',
    danger: 'badge-danger',
    info: 'badge-info',
    neutral: 'badge-neutral',
};

export function Badge({ className, variant = 'neutral', ...props }) {
    return (
        <span
            className={cn('badge', VARIANT_CLASS[variant], className)}
            {...props}
        />
    );
}
