import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'

const JWT_SECRET = process.env.JWT_SECRET || 'rahasia-sip-2024'

export interface UserPayload {
    id: string
    username: string
    role: 'KARYAWAN' | 'OWNER'
}

export async function hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 10)
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash)
}

export function createToken(user: UserPayload): string {
    return jwt.sign(user, JWT_SECRET, { expiresIn: '7d' })
}

export function verifyToken(token: string): UserPayload | null {
    try {
        return jwt.verify(token, JWT_SECRET) as UserPayload
    } catch (error) {
        console.error('Verify token failed:', error)
        return null
    }
}

export function getTokenFromCookie(cookieHeader: string | null): string | null {
    if (!cookieHeader) return null
    const match = cookieHeader.match(/token=([^;]+)/)
    return match ? match[1] : null
}
