// Mock next-auth/react for Jest tests
export const SessionProvider = ({ children }: { children: React.ReactNode }) => children;

export const useSession = jest.fn().mockReturnValue({
  data: {
    user: {
      email: 'test@example.com',
      name: 'Test User',
      isAdmin: true,
      role: 'admin',
    },
  },
  status: 'authenticated',
});

export const signIn = jest.fn();
export const signOut = jest.fn();
