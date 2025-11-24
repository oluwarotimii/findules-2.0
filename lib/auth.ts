import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

export interface JWTPayload {
    userId: string
    email: string
    role: string
    branchId: string
}

/**
 * Hash a password using bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 12)
}

/**
 * Verify a password against a hash
 */
export async function verifyPassword(
    password: string,
    hashedPassword: string
): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword)
}

/**
 * Generate a JWT token
 */
export function generateToken(payload: JWTPayload): string {
    return jwt.sign(payload, JWT_SECRET, {
        expiresIn: '8h',
    })
}

/**
 * Verify and decode a JWT token
 */
export function verifyToken(token: string): JWTPayload | null {
    try {
        console.log('Verifying token with secret:', JWT_SECRET ? 'exists' : 'missing')
        const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload
        console.log('Token verified successfully for user:', decoded.userId)
        return decoded
    } catch (error: any) {
        console.error('Token verification failed:', error.message)
        return null
    }
}
