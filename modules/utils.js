function parseTime(value) {
    const input = String(value).trim().toLowerCase();

    if (!input) {
        throw new Error('Auto interval cannot be empty.');
    }

    const compactInput = input.replace(/\s+/g, '');
    const pattern = /(\d+)([dhms]?)/g;
    let totalMs = 0;
    let consumed = '';

    for (const match of compactInput.matchAll(pattern)) {
        const amount = Number(match[1]);
        const unit = match[2] || 'm';

        if (Number.isNaN(amount)) {
            throw new Error(`Invalid auto interval value: ${value}`);
        }

        consumed += match[0];

        switch (unit) {
            case 'd':
                totalMs += amount * 24 * 60 * 60 * 1000;
                break;
            case 'h':
                totalMs += amount * 60 * 60 * 1000;
                break;
            case 'm':
                totalMs += amount * 60 * 1000;
                break;
            case 's':
                totalMs += amount * 1000;
                break;
            default:
                throw new Error(`Invalid auto interval unit in: ${value}`);
        }
    }

    if (!consumed || consumed !== compactInput) {
        throw new Error(`Invalid auto interval format: ${value}`);
    }

    if (totalMs <= 0) {
        throw new Error(`Auto interval must be greater than zero: ${value}`);
    }

    return totalMs;
}

function parseTimeLiteral(value) {
    const input = String(value).trim().toLowerCase();

    if (!input) {
        throw new Error('Auto interval cannot be empty.');
    }

    const compactInput = input.replace(/\s+/g, '');
    const pattern = /(\d+)([dhms]?)/g;
    const parts = [];
    let consumed = '';

    for (const match of compactInput.matchAll(pattern)) {
        const amount = Number(match[1]);
        const unit = match[2] || 'm';

        if (Number.isNaN(amount)) {
            throw new Error(`Invalid auto interval value: ${value}`);
        }

        const unitName = {
            d: amount === 1 ? 'day' : 'days',
            h: amount === 1 ? 'hour' : 'hours',
            m: amount === 1 ? 'minute' : 'minutes',
            s: amount === 1 ? 'second' : 'seconds',
        }[unit];

        if (!unitName) {
            throw new Error(`Invalid auto interval unit in: ${value}`);
        }

        consumed += match[0];
        parts.push(`${amount} ${unitName}`);
    }

    if (!parts.length) {
        throw new Error(`Invalid auto interval format: ${value}`);
    }

    if (consumed !== compactInput) {
        throw new Error(`Invalid auto interval format: ${value}`);
    }

    if (parts.length === 1) {
        return parts[0];
    }

    if (parts.length === 2) {
        return `${parts[0]} and ${parts[1]}`;
    }

    return `${parts.slice(0, -1).join(', ')}, and ${parts[parts.length - 1]}`;
}

module.exports = {
    parseTime,
    parseTimeLiteral,
};