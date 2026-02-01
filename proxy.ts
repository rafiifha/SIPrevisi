import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function proxy(request: NextRequest) {
    const token = request.cookies.get('token')?.value
    const { pathname } = request.nextUrl

    // Proteksi route /karyawan
    if (pathname.startsWith('/karyawan')) {
        if (!token) {
            return NextResponse.redirect(new URL('/login', request.url))
        }
        // Verifikasi role simpel (decode JWT tanpa verify signature karena edge runtime keterbatasan library)
        // Atau serahkan validasi penuh ke API/Layout, middleware hanya cek keberadaan token
    }

    // Proteksi route /owner
    if (pathname.startsWith('/owner')) {
        if (!token) {
            return NextResponse.redirect(new URL('/login', request.url))
        }
    }

    return NextResponse.next()
}

export const config = {
    matcher: ['/karyawan/:path*', '/owner/:path*'],
}
