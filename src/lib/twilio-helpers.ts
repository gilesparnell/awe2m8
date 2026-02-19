import fs from 'fs';
import path from 'path';

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
}

function writeConfig(config: TwilioConfig): void {
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
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

export function getNumberCustomers(): Record<string, string> {
    try {
        const config = readConfig();
        return config.numberCustomers || {};
    } catch (e) {
        console.error('Error reading Twilio number customer metadata:', e);
        return {};
    }
}

export function getNumberCustomer(phoneNumberSid: string): string {
    const customers = getNumberCustomers();
    return customers[phoneNumberSid] || '';
}

export function saveNumberCustomer(phoneNumberSid: string, customer: string): void {
    try {
        const config = readConfig();
        const cleanedCustomer = customer.trim();
        const customers = config.numberCustomers || {};

        if (!cleanedCustomer) {
            delete customers[phoneNumberSid];
        } else {
            customers[phoneNumberSid] = cleanedCustomer;
        }

        config.numberCustomers = customers;
        writeConfig(config);
    } catch (e) {
        console.error('Error writing Twilio number customer metadata:', e);
    }
}
