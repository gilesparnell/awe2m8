/**
 * Mock Twilio Client for Testing
 * Simulates Twilio API responses without making real API calls
 */

export interface MockNumber {
    sid: string;
    phoneNumber: string;
    friendlyName: string;
    accountSid: string;
    bundleSid?: string;
    capabilities?: { sms: boolean; mms: boolean; voice: boolean };
}

export interface MockBundle {
    sid: string;
    friendlyName: string;
    status: string;
    isoCountry: string;
    numberType?: string;
}

export interface MockAddress {
    sid: string;
    street: string;
    city: string;
    region: string;
    postalCode: string;
    isoCountry: string;
    validated?: boolean;
}

export interface MockAvailableNumber {
    phoneNumber: string;
    friendlyName?: string;
    locality?: string;
    region?: string;
}

// In-memory state for testing
let mockNumbers: Map<string, MockNumber[]> = new Map();
let mockBundles: Map<string, MockBundle[]> = new Map();
let mockAddresses: Map<string, MockAddress[]> = new Map();
let mockAccounts: Map<string, { sid: string; authToken: string; friendlyName: string }> = new Map();
let mockAvailableNumbers: Map<string, MockAvailableNumber[]> = new Map();

// Error simulation flags
let simulateError: { code?: number; message?: string } | null = null;

export const resetMockState = () => {
    mockNumbers = new Map();
    mockBundles = new Map();
    mockAddresses = new Map();
    mockAccounts = new Map();
    mockAvailableNumbers = new Map();
    simulateError = null;
};

export const setMockError = (code: number, message: string) => {
    simulateError = { code, message };
};

export const clearMockError = () => {
    simulateError = null;
};

export const addMockAccount = (sid: string, friendlyName: string) => {
    mockAccounts.set(sid, { sid, authToken: `token_${sid}`, friendlyName });
};

export const addMockNumber = (accountSid: string, number: MockNumber) => {
    const existing = mockNumbers.get(accountSid) || [];
    existing.push({ ...number, accountSid });
    mockNumbers.set(accountSid, existing);
};

export const addMockBundle = (accountSid: string, bundle: MockBundle) => {
    const existing = mockBundles.get(accountSid) || [];
    existing.push(bundle);
    mockBundles.set(accountSid, existing);
};

export const addMockAddress = (accountSid: string, address: MockAddress) => {
    const existing = mockAddresses.get(accountSid) || [];
    existing.push(address);
    mockAddresses.set(accountSid, existing);
};

export const getMockNumbers = (accountSid: string) => mockNumbers.get(accountSid) || [];
export const getMockBundles = (accountSid: string) => mockBundles.get(accountSid) || [];
export const getMockAddresses = (accountSid: string) => mockAddresses.get(accountSid) || [];
export const setMockAvailableNumbers = (isoCountry: string, numbers: MockAvailableNumber[]) => {
    mockAvailableNumbers.set(isoCountry.toUpperCase(), numbers);
};

// Move a number between accounts (simulates successful port)
export const moveNumber = (numberSid: string, fromAccount: string, toAccount: string) => {
    const fromNumbers = mockNumbers.get(fromAccount) || [];
    const index = fromNumbers.findIndex(n => n.sid === numberSid);
    if (index === -1) throw new Error(`Number ${numberSid} not found in ${fromAccount}`);

    const [number] = fromNumbers.splice(index, 1);
    number.accountSid = toAccount;

    mockNumbers.set(fromAccount, fromNumbers);
    const toNumbers = mockNumbers.get(toAccount) || [];
    toNumbers.push(number);
    mockNumbers.set(toAccount, toNumbers);

    return number;
};

// The mock Twilio client factory
export const createMockTwilioClient = (accountSid: string, authToken: string, options?: any) => {
    const targetAccountSid = options?.accountSid || accountSid;

    return {
        api: {
            v2010: {
                accounts: Object.assign(
                    (sid: string) => ({
                        fetch: async () => {
                            if (simulateError) {
                                const err = new Error(simulateError.message) as any;
                                err.code = simulateError.code;
                                throw err;
                            }
                            const account = mockAccounts.get(sid);
                            if (!account) throw new Error(`Account ${sid} not found`);
                            return account;
                        },
                        incomingPhoneNumbers: Object.assign(
                            // ... existing incomingPhoneNumbers implementation ...
                            (numberSid: string) => ({
                                fetch: async () => {
                                    const numbers = mockNumbers.get(sid) || [];
                                    const number = numbers.find(n => n.sid === numberSid);
                                    if (!number) {
                                        const err = new Error(`Number ${numberSid} not found`) as any;
                                        err.code = 20404;
                                        throw err;
                                    }
                                    return number;
                                },
                                update: async (params: any) => {
                                    if (simulateError) {
                                        const err = new Error(simulateError.message) as any;
                                        err.code = simulateError.code;
                                        throw err;
                                    }

                                    // Simulate bundle/address requirements for AU
                                    const numbers = mockNumbers.get(sid) || [];
                                    const number = numbers.find(n => n.sid === numberSid);
                                    if (!number) {
                                        const err = new Error(`Number not found`) as any;
                                        err.code = 20404;
                                        throw err;
                                    }

                                    if (number.phoneNumber.startsWith('+61')) {
                                        if (!params.bundleSid) {
                                            const err = new Error('Bundle required for AU') as any;
                                            err.code = 21649;
                                            throw err;
                                        }
                                        if (!params.addressSid) {
                                            const err = new Error('Address required for AU') as any;
                                            err.code = 21631;
                                            throw err;
                                        }

                                        // Verify bundle exists in target
                                        const targetBundles = mockBundles.get(params.accountSid) || [];
                                        const bundle = targetBundles.find(b => b.sid === params.bundleSid);
                                        if (!bundle) {
                                            const err = new Error('Bundle not found in target') as any;
                                            err.code = 21649;
                                            throw err;
                                        }

                                        // Verify address exists in target
                                        const targetAddresses = mockAddresses.get(params.accountSid) || [];
                                        const address = targetAddresses.find(a => a.sid === params.addressSid);
                                        if (!address) {
                                            const err = new Error('Address not in bundle') as any;
                                            err.code = 21651;
                                            throw err;
                                        }
                                    }

                                    // Perform the move
                                    return moveNumber(numberSid, sid, params.accountSid);
                                },
                            }),
                            {
                                list: async (opts?: { phoneNumber?: string; limit?: number }) => {
                                    let numbers = mockNumbers.get(sid) || [];
                                    if (opts?.phoneNumber) {
                                        numbers = numbers.filter(n => n.phoneNumber === opts.phoneNumber);
                                    }
                                    return numbers.slice(0, opts?.limit || 100);
                                },
                            }
                        ),
                    }),
                    {
                        list: async (opts?: { status?: string; limit?: number }) => {
                            // Return all mock accounts
                            return Array.from(mockAccounts.values());
                        }
                    }
                ),
            },
        },
        incomingPhoneNumbers: {
            create: async (params: { phoneNumber: string; bundleSid?: string }) => {
                const created: MockNumber = {
                    sid: `PN_NEW_${Date.now()}`,
                    phoneNumber: params.phoneNumber,
                    friendlyName: params.phoneNumber,
                    accountSid: targetAccountSid,
                    bundleSid: params.bundleSid,
                    capabilities: { sms: true, mms: true, voice: true }
                };
                addMockNumber(targetAccountSid, created);
                return created;
            }
        },
        availablePhoneNumbers: (isoCountry: string) => ({
            local: {
                list: async (opts?: { limit?: number }) => {
                    const list = mockAvailableNumbers.get(isoCountry.toUpperCase()) || [];
                    return list.slice(0, opts?.limit || 20);
                }
            }
        }),
        numbers: {
            v2: {
                regulatoryCompliance: {
                    bundles: {
                        list: async (opts?: { status?: string; isoCountry?: string; numberType?: string }) => {
                            let bundles = mockBundles.get(targetAccountSid) || [];
                            if (opts?.status) bundles = bundles.filter(b => b.status === opts.status);
                            if (opts?.isoCountry) bundles = bundles.filter(b => b.isoCountry === opts.isoCountry);
                            if (opts?.numberType) bundles = bundles.filter(b => b.numberType === opts.numberType);
                            return bundles;
                        },
                    },
                },
            },
        },
        addresses: {
            list: async (opts?: { isoCountry?: string }) => {
                let addresses = mockAddresses.get(targetAccountSid) || [];
                if (opts?.isoCountry) addresses = addresses.filter(a => a.isoCountry === opts.isoCountry);
                return addresses;
            },
            create: async (data: Partial<MockAddress>) => {
                const address: MockAddress = {
                    sid: `AD_NEW_${Date.now()}`,
                    street: data.street || '',
                    city: data.city || '',
                    region: data.region || '',
                    postalCode: data.postalCode || '',
                    isoCountry: data.isoCountry || 'AU',
                    validated: true,
                };
                addMockAddress(targetAccountSid, address);
                return address;
            },
        },
    };
};

// Jest mock setup helper
export const setupTwilioMock = () => {
    jest.mock('twilio', () => ({
        __esModule: true,
        default: createMockTwilioClient,
    }));
};
