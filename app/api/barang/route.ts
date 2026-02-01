import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken, getTokenFromCookie } from '@/lib/auth'

import { cookies } from 'next/headers'

// GET - List semua barang
export async function GET(request: NextRequest) {
    const cookieStore = await cookies()
    const token = cookieStore.get('token')?.value

    if (!token || !verifyToken(token)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const barang = await prisma.barang.findMany({
        orderBy: { createdAt: 'desc' },
        include: { kategori: true }
    })
    return NextResponse.json(barang)
}

// POST - Tambah barang baru
export async function POST(request: NextRequest) {
    const cookieStore = await cookies()
    const token = cookieStore.get('token')?.value

    if (!token || !verifyToken(token)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        const { nama, stok, kategoriId, satuan, leadTime } = await request.json()

        if (!nama) {
            return NextResponse.json({ error: 'Nama barang wajib diisi' }, { status: 400 })
        }

        // Generate kode otomatis
        const lastBarang = await prisma.barang.findFirst({
            orderBy: { kode: 'desc' }
        })

        let newKode = 'BRG001'
        if (lastBarang && lastBarang.kode.startsWith('BRG')) {
            const lastNumber = parseInt(lastBarang.kode.replace('BRG', ''))
            if (!isNaN(lastNumber)) {
                newKode = `BRG${(lastNumber + 1).toString().padStart(3, '0')}`
            }
        }

        const barang = await prisma.barang.create({
            data: {
                kode: newKode,
                nama,
                stok: stok || 0,
                satuan: satuan || 'Pcs',
                leadTime: leadTime || 7, // Default 7 hari
                kategoriId: kategoriId || null
            },
            include: { kategori: true }
        })

        return NextResponse.json(barang, { status: 201 })
    } catch (error) {
        console.error('Create barang error:', error)
        return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 })
    }
}
