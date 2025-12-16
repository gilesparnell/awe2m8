// Mock next-auth for Jest tests
const NextAuth = jest.fn(() => ({
  handlers: {
    GET: jest.fn(),
    POST: jest.fn(),
  },
  auth: jest.fn().mockResolvedValue({
    user: {
      email: 'test@example.com',
      name: 'Test User',
      isAdmin: true,
      role: 'admin',
    },
  }),
  signIn: jest.fn(),
  signOut: jest.fn(),
}));

export default NextAuth;
export const getServerSession = jest.fn();
