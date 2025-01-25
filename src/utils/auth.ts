import { Context } from 'hono';
import { verify, JwtPayload } from 'jsonwebtoken';

interface UserToken extends JwtPayload {
  sub?: string;
  userId?: string;
  role: string;
  familyId?: string;
}

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_for_development';

export async function getUserFromToken(c: Context): Promise<UserToken | null> {
  try {
    const authHeader = c.req.header('Authorization');
    if (!authHeader) return null;

    const token = authHeader.split('Bearer ')[1];
    if (!token) return null;

    const decoded = verify(token, JWT_SECRET) as UserToken;
    return {
      userId: decoded.sub || decoded.userId,
      role: decoded.role || 'user',
      familyId: decoded.familyId
    };
  } catch (error) {
    console.error('Token verification failed:', error);
    return null;
  }
}

export function verifyToken(token: string): UserToken | null {
  try {
    const decoded = verify(token, JWT_SECRET) as UserToken;
    return {
      userId: decoded.sub || decoded.userId,
      role: decoded.role || 'user',
      familyId: decoded.familyId
    };
  } catch (error) {
    console.error('Token verification failed:', error);
    return null;
  }
}