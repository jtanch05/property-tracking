// WhatsApp message generation utility

const COUNTRY_CODE = '60'; // Malaysia

/**
 * Clean phone number and format for WhatsApp
 */
function cleanPhone(phone) {
    if (!phone) return '';
    let cleaned = phone.replace(/[\s\-()]/g, '');
    // Handle Malaysian numbers
    if (cleaned.startsWith('0')) {
        cleaned = COUNTRY_CODE + cleaned.slice(1);
    }
    if (!cleaned.startsWith('+') && !cleaned.startsWith(COUNTRY_CODE)) {
        cleaned = COUNTRY_CODE + cleaned;
    }
    cleaned = cleaned.replace(/^\+/, '');
    return cleaned;
}

/**
 * Generate WhatsApp URL with pre-filled message
 */
export function generateWhatsAppURL(phone, message) {
    const cleanedPhone = cleanPhone(phone);
    const encodedMsg = encodeURIComponent(message);
    if (cleanedPhone) {
        return `https://wa.me/${cleanedPhone}?text=${encodedMsg}`;
    }
    // No phone = open WhatsApp with just the message (user picks chat)
    return `https://wa.me/?text=${encodedMsg}`;
}

/**
 * Generate rent reminder message for tenant
 */
export function generateRentReminder(tenant, rentRecord, property) {
    const name = tenant?.name || 'Tenant';
    const propName = property?.nickname || 'the property';
    const amount = rentRecord?.amountDue || 0;
    const month = rentRecord?.month || '';

    return `Hi ${name}, friendly reminder that rent of RM${amount.toLocaleString()} for ${propName} is due for ${month}. Please make the payment at your earliest convenience. Thank you! 🏠`;
}

/**
 * Generate self-reminder message from alert
 */
export function generateSelfReminder(alert) {
    return `🔔 PropTrack Reminder\n\n${alert.title}\n${alert.message}\n\nAction needed by: ${alert.date || 'ASAP'}`;
}

/**
 * Open WhatsApp with rent reminder to tenant
 */
export function sendRentReminder(tenant, rentRecord, property) {
    const message = generateRentReminder(tenant, rentRecord, property);
    const url = generateWhatsAppURL(tenant?.phone, message);
    window.open(url, '_blank');
}

/**
 * Open WhatsApp with self-reminder
 */
export function sendSelfReminder(alert) {
    const message = generateSelfReminder(alert);
    const url = generateWhatsAppURL('', message);
    window.open(url, '_blank');
}
