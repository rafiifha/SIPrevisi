import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyPassword, createToken } from '@/lib/auth'

export async function POST(request: NextRequest) {
    try {
        const { username, password } = await request.json()

        if (!username || !password) {
            return NextResponse.json({ error: 'Username dan password wajib diisi' }, { status: 400 })
        }

        const user = await prisma.user.findUnique({ where: { username } })

        if (!user) {
            return NextResponse.json({ error: 'Username tidak ditemukan' }, { status: 401 })
        }

        const valid = await verifyPassword(password, user.password)
        if (!valid) {
            return NextResponse.json({ error: 'Password salah' }, { status: 401 })
        }

        const token = createToken({ id: user.id, username: user.username, role: user.role })

        const response = NextResponse.json({
            success: true,
            user: { id: user.id, username: user.username, role: user.role }
        })

        response.cookies.set('token', token, {
            httpOnly: true,
            secure: false, // Set false for localhost debugging
            sameSite: 'lax',
            path: '/',
            maxAge: 60 * 60 * 24 * 7 // 7 days
        })

        return response
    } catch (error) {
        console.error('Login error:', error)
        return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 })
    }
}
