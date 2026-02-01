import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'
import { cookies } from 'next/headers'

// GET - List semua kategori
export async function GET(request: NextRequest) {
    const cookieStore = await cookies()
    const token = cookieStore.get('token')?.value

    if (!token || !verifyToken(token)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        const kategori = await prisma.kategori.findMany({
            orderBy: { nama: 'asc' },
            include: {
                _count: {
                    select: { barang: true }
                }
            }
        })
        return NextResponse.json(kategori)
    } catch (error: any) {
        console.error('Fetch kategori error:', error)
        return NextResponse.json({
            error: 'Terjadi kesalahan sistem',
            detail: error?.message
        }, { status: 500 })
    }
}

// POST - Tambah kategori baru
export async function POST(request: NextRequest) {
    const cookieStore = await cookies()
    const token = cookieStore.get('token')?.value

    if (!token || !verifyToken(token)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        const { nama } = await request.json()

        if (!nama) {
            return NextResponse.json({ error: 'Nama kategori wajib diisi' }, { status: 400 })
        }

        // Check if kategori already exists
        const existing = await prisma.kategori.findUnique({
            where: { nama }
        })

        if (existing) {
            return NextResponse.json({ error: 'Kategori sudah ada' }, { status: 400 })
        }

        const kategori = await prisma.kategori.create({
            data: { nama }
        })

        return NextResponse.json(kategori, { status: 201 })
    } catch (error) {
        console.error('Create kategori error:', error)
        return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 })
    }
}
