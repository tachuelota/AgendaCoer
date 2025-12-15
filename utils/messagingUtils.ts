
/**
 * Creates a mailto URL with multiple recipients in the BCC field for privacy.
 * @param emails - An array of email addresses.
 * @returns A mailto URL string.
 */
export function createMailtoUrl(emails: string[]): string {
    if (!emails || emails.length === 0) {
        return 'mailto:';
    }
    const bcc = emails.join(',');
    return `mailto:?bcc=${encodeURIComponent(bcc)}`;
}

/**
 * Cleans a phone number and formats it for a WhatsApp URL (wa.me).
 * Assumes Peruvian numbers. If a number is 9 digits and starts with 9, it prepends '51'.
 * Removes non-numeric characters.
 * @param phone - The phone number string.
 * @returns The cleaned phone number string.
 */
export function cleanPhoneNumberForWhatsApp(phone: string): string {
    let cleaned = phone.replace(/\D/g, ''); // Remove all non-digit characters
    
    // For Peru, mobile numbers are 9 digits long and start with 9.
    // If the number fits this pattern, prepend the country code '51'.
    if (cleaned.length === 9 && cleaned.startsWith('9')) {
        return `51${cleaned}`;
    }
    
    // If it already includes the country code, just return it.
    if (cleaned.startsWith('51') && cleaned.length === 11) {
        return cleaned;
    }

    // Return the cleaned number as is for other cases (e.g., landlines)
    return cleaned;
}

/**
 * Creates a WhatsApp chat URL for a given phone number.
 * @param phone - The phone number.
 * @returns The full wa.me URL.
 */
export function createWhatsAppUrl(phone: string): string {
    const cleanedPhone = cleanPhoneNumberForWhatsApp(phone);
    return `https://wa.me/${cleanedPhone}`;
}
