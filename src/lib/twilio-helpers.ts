import fs from 'fs';
import path from 'path';

const CONFIG_FILE = path.join(process.cwd(), 'twilio_config.json');

interface TwilioConfig {
    notificationNumbers: string[];
}

export function getNotificationNumbers(): string[] {
    try {
        // Default numbers if config doesn't exist
        const defaultNumbers = ['+61401027141', '+61404283605'];

        if (fs.existsSync(CONFIG_FILE)) {
            const data = fs.readFileSync(CONFIG_FILE, 'utf-8');
            const config = JSON.parse(data) as TwilioConfig;

            if (config.notificationNumbers && Array.isArray(config.notificationNumbers) && config.notificationNumbers.length > 0) {
                return config.notificationNumbers;
            }
        }
        return defaultNumbers;
    } catch (e) {
        console.error('Error reading notification numbers config:', e);
        return ['+61401027141', '+61404283605']; // Return defaults on error
    }
}

export function saveNotificationNumbers(numbers: string[]): void {
    try {
        const config: TwilioConfig = { notificationNumbers: numbers };
        fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
    } catch (e) {
        console.error('Error writing notification numbers config:', e);
    }
}
