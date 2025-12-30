import { SignJWT, jwtVerify } from 'jose'

const JWT_SECRET = new TextEncoder().encode(
    process.env.JWT_SECRET || 'your-secret-key'
)

export interface JWTPayload {
    id: string
    email: string
    role: string
    branchId: string
}

export async function verifyTokenEdge(token: string): Promise<JWTPayload | null> {
    try {
        const { payload } = await jwtVerify(token, JWT_SECRET)

        // Extract our custom fields
        return {
            id: payload.id as string,
            email: payload.email as string,
            role: payload.role as string,
            branchId: payload.branchId as string,
        }
    } catch (error: any) {
        console.error('Token verification failed:', error.message)
        return null
    }
}

export async function generateTokenEdge(payload: JWTPayload): Promise<string> {
    return await new SignJWT({ ...payload })
        .setProtectedHeader({ alg: 'HS256' })
        .setExpirationTime('8h')
        .sign(JWT_SECRET)
}
