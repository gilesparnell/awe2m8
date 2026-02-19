/**
 * @jest-environment node
 */

import { POST } from '@/app/api/agents/heartbeat/route';
import { getAdminDb } from '@/lib/firebase-admin';

// Mock Firebase Admin
const mockUpdate = jest.fn();
const mockGet = jest.fn();

jest.mock('@/lib/firebase-admin', () => ({
  getAdminDb: jest.fn(),
}));

describe('/api/agents/heartbeat', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Default mock implementations
    const mockDoc = {
      update: mockUpdate,
      get: mockGet,
    };
    
    const mockCollection = {
      doc: jest.fn(() => mockDoc),
    };
    
    (getAdminDb as jest.Mock).mockReturnValue({
      collection: jest.fn(() => mockCollection),
    });
  });

  it('should return 400 when agentId is missing', async () => {
    const request = new Request('http://localhost:3005/api/agents/heartbeat', {
      method: 'POST',
      body: JSON.stringify({}),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('agentId is required');
  });

  it('should return 404 when agent does not exist', async () => {
    mockGet.mockResolvedValue({
      exists: false,
    });

    const request = new Request('http://localhost:3005/api/agents/heartbeat', {
      method: 'POST',
      body: JSON.stringify({ agentId: 'nonexistent' }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe('Agent not found');
  });

  it('should update heartbeat for existing agent', async () => {
    mockGet.mockResolvedValue({
      exists: true,
      data: () => ({
        status: 'idle',
        lastHeartbeat: null,
      }),
    });

    const request = new Request('http://localhost:3005/api/agents/heartbeat', {
      method: 'POST',
      body: JSON.stringify({ agentId: 'fury' }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.timestamp).toBeDefined();
    
    expect(mockUpdate).toHaveBeenCalledWith({
      lastHeartbeat: expect.any(Object), // Timestamp
      lastActivity: expect.any(Object),
      isOnline: true,
    });
  });

  it('should change status from idle to active when provided', async () => {
    mockGet.mockResolvedValue({
      exists: true,
      data: () => ({
        status: 'idle',
      }),
    });

    const request = new Request('http://localhost:3005/api/agents/heartbeat', {
      method: 'POST',
      body: JSON.stringify({ agentId: 'fury', status: 'active' }),
    });

    await POST(request);

    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'active',
      })
    );
  });

  it('should not change status if already active', async () => {
    mockGet.mockResolvedValue({
      exists: true,
      data: () => ({
        status: 'active',
      }),
    });

    const request = new Request('http://localhost:3005/api/agents/heartbeat', {
      method: 'POST',
      body: JSON.stringify({ agentId: 'fury', status: 'active' }),
    });

    await POST(request);

    // Should not include status in update
    const updateCall = mockUpdate.mock.calls[0][0];
    expect(updateCall.status).toBeUndefined();
  });

  it('should handle server errors gracefully', async () => {
    mockGet.mockRejectedValue(new Error('Database error'));

    const request = new Request('http://localhost:3005/api/agents/heartbeat', {
      method: 'POST',
      body: JSON.stringify({ agentId: 'fury' }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Failed to update heartbeat');
  });

  it('should handle invalid JSON in request body', async () => {
    const request = new Request('http://localhost:3005/api/agents/heartbeat', {
      method: 'POST',
      body: 'invalid json',
    });

    const response = await POST(request);
    
    // Should return 500 due to JSON parse error
    expect(response.status).toBe(500);
  });

  it('should use correct Firestore collection path', async () => {
    mockGet.mockResolvedValue({
      exists: true,
      data: () => ({ status: 'idle' }),
    });

    const mockDb = getAdminDb();
    const mockCollection = mockDb.collection;
    const mockDoc = jest.fn();
    
    mockCollection.mockReturnValue({ doc: mockDoc });

    const request = new Request('http://localhost:3005/api/agents/heartbeat', {
      method: 'POST',
      body: JSON.stringify({ agentId: 'friday' }),
    });

    await POST(request);

    expect(mockCollection).toHaveBeenCalledWith('agents');
    expect(mockDoc).toHaveBeenCalledWith('friday');
  });
});
