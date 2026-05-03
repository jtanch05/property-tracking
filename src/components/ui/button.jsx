import React from 'react';
import { cn } from '../../lib/utils';

const VARIANT_CLASS = {
    primary: 'btn-primary',
    secondary: 'btn-secondary',
    danger: 'btn-danger',
    ghost: 'btn-ghost',
    outline: 'btn-outline',
};

const SIZE_CLASS = {
    md: '',
    sm: 'btn-sm',
    icon: 'btn-icon',
};

export function Button({
    className,
    variant = 'primary',
    size = 'md',
    type = 'button',
    ...props
}) {
    return (
        <button
            type={type}
            className={cn(
                size === 'icon' ? 'btn-icon' : 'btn',
                VARIANT_CLASS[variant],
                SIZE_CLASS[size],
                className
            )}
            {...props}
        />
    );
}
