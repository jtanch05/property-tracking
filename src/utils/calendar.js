// Calendar .ics file generation utility

/**
 * Generate a single .ics calendar event string
 */
export function generateICSEvent(alert) {
    const uid = `proptrack-${alert.id}@proptrack.local`;
    const now = formatICSDate(new Date());
    const eventDate = alert.date ? formatICSDate(new Date(alert.date)) : now;
    const nextDay = alert.date ? formatICSDate(new Date(new Date(alert.date).getTime() + 86400000)) : now;

    return [
        'BEGIN:VEVENT',
        `UID:${uid}`,
        `DTSTAMP:${now}`,
        `DTSTART;VALUE=DATE:${eventDate}`,
        `DTEND;VALUE=DATE:${nextDay}`,
        `SUMMARY:${escapeICS(alert.title)}`,
        `DESCRIPTION:${escapeICS(alert.message)}`,
        `CATEGORIES:PropTrack`,
        // Reminders: 1 week, 1 day, 1 hour before
        'BEGIN:VALARM',
        'TRIGGER:-P7D',
        'ACTION:DISPLAY',
        `DESCRIPTION:${escapeICS(alert.title)} - 1 week reminder`,
        'END:VALARM',
        'BEGIN:VALARM',
        'TRIGGER:-P1D',
        'ACTION:DISPLAY',
        `DESCRIPTION:${escapeICS(alert.title)} - 1 day reminder`,
        'END:VALARM',
        'BEGIN:VALARM',
        'TRIGGER:-PT1H',
        'ACTION:DISPLAY',
        `DESCRIPTION:${escapeICS(alert.title)} - 1 hour reminder`,
        'END:VALARM',
        'END:VEVENT',
    ].join('\r\n');
}

/**
 * Generate a complete .ics file with all events
 */
export function generateBulkICS(alerts) {
    const events = alerts.map(a => generateICSEvent(a)).join('\r\n');
    return [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//PropTrack MY//EN',
        'CALSCALE:GREGORIAN',
        'METHOD:PUBLISH',
        'X-WR-CALNAME:PropTrack Alerts',
        events,
        'END:VCALENDAR',
    ].join('\r\n');
}

/**
 * Generate single event .ics file
 */
export function generateSingleICS(alert) {
    return [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//PropTrack MY//EN',
        'CALSCALE:GREGORIAN',
        'METHOD:PUBLISH',
        generateICSEvent(alert),
        'END:VCALENDAR',
    ].join('\r\n');
}

/**
 * Download an .ics file
 */
export function downloadICS(content, filename = 'proptrack-alert') {
    const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}.ics`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// --- Helpers ---

function formatICSDate(date) {
    const d = new Date(date);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}${m}${day}`;
}

function escapeICS(text) {
    if (!text) return '';
    return text
        .replace(/\\/g, '\\\\')
        .replace(/;/g, '\\;')
        .replace(/,/g, '\\,')
        .replace(/\n/g, '\\n');
}
