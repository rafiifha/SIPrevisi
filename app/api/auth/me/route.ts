import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
    const cookieStore = await cookies()
    const token = cookieStore.get('token')?.value

    console.log('Server token check:', token ? 'Found' : 'Missing')

    if (!token) {
        return NextResponse.json({ user: null }, { status: 401 })
    }

    const user = verifyToken(token)

    if (!user) {
        return NextResponse.json({ user: null }, { status: 401 })
    }

    return NextResponse.json({ user })
}
