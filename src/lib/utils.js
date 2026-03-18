import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merges class names using clsx + tailwind-merge.
 * Required by all shadcn/ui-style components in /components/ui.
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}
