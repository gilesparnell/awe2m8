// Mock auth module for Jest tests
export const auth = jest.fn().mockResolvedValue({
  user: {
    email: 'test@example.com',
    name: 'Test User',
    isAdmin: true,
    role: 'admin',
  },
});

export const signIn = jest.fn();
export const signOut = jest.fn();
export const handlers = {
  GET: jest.fn(),
  POST: jest.fn(),
};
