import { prisma } from './prisma';

const DEFAULT_NOTIFICATION_NUMBERS = ['+61401027141', '+61404283605'];

export function getNotificationNumbers(): string[] {
    const envNumbers = process.env.NOTIFICATION_NUMBERS;
    if (envNumbers) {
        const parsed = envNumbers.split(',').map((n) => n.trim()).filter(Boolean);
        if (parsed.length > 0) return parsed;
    }
    return DEFAULT_NOTIFICATION_NUMBERS;
}

export async function getNumberPurposes(): Promise<Record<string, string>> {
    try {
        const rows = await prisma.twilioNumberPurpose.findMany();
        const purposes: Record<string, string> = {};
        for (const row of rows) {
            purposes[row.phoneNumberSid] = row.purpose;
        }
        return purposes;
    } catch (e) {
        console.error('Error reading Twilio number purposes:', e);
        return {};
    }
}

export async function getNumberPurpose(phoneNumberSid: string): Promise<string> {
    try {
        const row = await prisma.twilioNumberPurpose.findUnique({
            where: { phoneNumberSid },
        });
        return row?.purpose || '';
    } catch (e) {
        console.warn('Error reading purpose for SID:', e);
        return '';
    }
}

export async function saveNumberPurpose(phoneNumberSid: string, purpose: string): Promise<void> {
    try {
        const cleanedPurpose = purpose.trim();
        if (!cleanedPurpose) {
            await prisma.twilioNumberPurpose.delete({
                where: { phoneNumberSid },
            }).catch(() => {}); // Ignore if not found
        } else {
            await prisma.twilioNumberPurpose.upsert({
                where: { phoneNumberSid },
                update: { purpose: cleanedPurpose },
                create: { phoneNumberSid, purpose: cleanedPurpose },
            });
        }
    } catch (e) {
        console.error('Error saving Twilio number purpose:', e);
        throw e;
    }
}
