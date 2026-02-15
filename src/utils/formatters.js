// Formatting utilities

export function formatCurrency(amount, currency = 'MYR') {
    if (amount === null || amount === undefined) return '—';
    return new Intl.NumberFormat('en-MY', {
        style: 'currency',
        currency,
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
    }).format(amount);
}

export function formatDate(dateStr) {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-MY', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    });
}

export function formatDateShort(dateStr) {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-MY', {
        day: 'numeric',
        month: 'short',
    });
}

export function formatMonth(monthStr) {
    if (!monthStr) return '—';
    const [year, month] = monthStr.split('-');
    const d = new Date(year, parseInt(month) - 1);
    return d.toLocaleDateString('en-MY', {
        month: 'long',
        year: 'numeric',
    });
}

export function formatRelativeDate(dateStr) {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    const now = new Date();
    const diff = Math.ceil((d - now) / (1000 * 60 * 60 * 24));

    if (diff === 0) return 'Today';
    if (diff === 1) return 'Tomorrow';
    if (diff === -1) return 'Yesterday';
    if (diff > 0 && diff <= 30) return `In ${diff} days`;
    if (diff < 0 && diff >= -30) return `${Math.abs(diff)} days ago`;
    return formatDate(dateStr);
}

export function formatPhone(phone) {
    if (!phone) return '—';
    return phone;
}

export function capitalizeFirst(str) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
}

export function slugify(str) {
    return str
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
}

export function truncate(str, maxLen = 40) {
    if (!str || str.length <= maxLen) return str;
    return str.slice(0, maxLen) + '…';
}

export function getStatusColor(status) {
    switch (status) {
        case 'paid':
        case 'active':
        case 'closed':
        case 'occupied':
            return 'success';
        case 'unpaid':
        case 'overdue':
        case 'expired':
            return 'danger';
        case 'pending':
        case 'expiring':
        case 'open':
            return 'warning';
        case 'vacated':
        case 'inactive':
            return 'neutral';
        default:
            return 'neutral';
    }
}
