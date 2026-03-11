import fs from 'fs';
import path from 'path';
import { getAdminDb } from './firebase-admin';

const CONFIG_FILE = path.join(process.cwd(), 'twilio_config.json');

interface TwilioConfig {
    notificationNumbers: string[];
    numberCustomers?: Record<string, string>;
}

function readConfig(): TwilioConfig {
    const defaultConfig: TwilioConfig = {
        notificationNumbers: ['+61401027141', '+61404283605'],
        numberCustomers: {}
    };

    try {
        if (!fs.existsSync(CONFIG_FILE)) {
            return defaultConfig;
        }

        const data = fs.readFileSync(CONFIG_FILE, 'utf-8');
        const parsed = JSON.parse(data) as Partial<TwilioConfig>;

        return {
            notificationNumbers: Array.isArray(parsed.notificationNumbers) && parsed.notificationNumbers.length > 0
                ? parsed.notificationNumbers
                : defaultConfig.notificationNumbers,
            numberCustomers: parsed.numberCustomers && typeof parsed.numberCustomers === 'object'
                ? parsed.numberCustomers
                : {}
        };
    } catch (e) {
        console.warn('Could not read local config file, using defaults:', e);
        return defaultConfig;
    }
}

function writeConfig(config: TwilioConfig): void {
    try {
        fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
    } catch (e) {
        console.warn('Could not write local config file (expected on Vercel):', e);
    }
}

export function getNotificationNumbers(): string[] {
    try {
        const config = readConfig();
        return config.notificationNumbers;
    } catch (e) {
        console.error('Error reading notification numbers config:', e);
        return ['+61401027141', '+61404283605']; // Return defaults on error
    }
}

export function saveNotificationNumbers(numbers: string[]): void {
    try {
        const config = readConfig();
        config.notificationNumbers = numbers;
        writeConfig(config);
    } catch (e) {
        console.error('Error writing notification numbers config:', e);
    }
}

export async function getNumberCustomers(): Promise<Record<string, string>> {
    try {
        const db = getAdminDb();
        const doc = await db.collection('twilio_config').doc('numbers').get();
        if (doc.exists) {
            return doc.data()?.customers || {};
        }
        return {};
    } catch (e) {
        console.error('Error reading Twilio number customer metadata from Firestore:', e);
        return {};
    }
}

export async function getNumberCustomer(phoneNumberSid: string): Promise<string> {
    try {
        const db = getAdminDb();
        const doc = await db.collection('twilio_config').doc('numbers').get();
        if (doc.exists) {
            const customers = doc.data()?.customers || {};
            return customers[phoneNumberSid] || '';
        }
        return '';
    } catch (e) {
        console.warn('Error reading customer for SID:', e);
        return '';
    }
}

export async function saveNumberCustomer(phoneNumberSid: string, customer: string): Promise<void> {
    try {
        const db = getAdminDb();
        const configRef = db.collection('twilio_config').doc('numbers');
        const doc = await configRef.get();
        const customers = (doc.data()?.customers || {}) as Record<string, string>;

        const cleanedCustomer = customer.trim();
        if (!cleanedCustomer) {
            delete customers[phoneNumberSid];
        } else {
            customers[phoneNumberSid] = cleanedCustomer;
        }

        await configRef.set({ customers }, { merge: true });
    } catch (e) {
        console.error('Error saving Twilio number customer metadata to Firestore:', e);
        throw e;
    }
}
