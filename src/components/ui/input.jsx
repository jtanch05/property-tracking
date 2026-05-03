import React from 'react';
import { cn } from '../../lib/utils';

export function Input({ className, ...props }) {
    return <input className={cn(className)} {...props} />;
}

export function Textarea({ className, ...props }) {
    return <textarea className={cn(className)} {...props} />;
}
