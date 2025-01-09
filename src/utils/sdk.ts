// Mock SDK utility to replace @familymanager/sdk functionality

export interface SDKUser {
  id: string;
  userId: string;
  role: string;
  familyId?: string;
}

export function mockVerifyToken(token: string): SDKUser | null {
  try {
    // In a real implementation, this would verify the token
    // For now, we'll return a mock user if a token is present
    if (!token) return null;

    return {
      id: 'mock-user-id',
      userId: 'mock-user-id',
      role: 'user',
      familyId: 'mock-family-id'
    };
  } catch (error) {
    console.error('Token verification failed:', error);
    return null;
  }
}

export function mockGetUserFromToken(token: string): SDKUser | null {
  return mockVerifyToken(token);
}