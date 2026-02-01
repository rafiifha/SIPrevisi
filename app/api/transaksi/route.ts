import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken, getTokenFromCookie } from '@/lib/auth'

import { cookies } from 'next/headers'

// GET - List transaksi
export async function GET(request: NextRequest) {
    const cookieStore = await cookies()
    const token = cookieStore.get('token')?.value

    if (!token || !verifyToken(token)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const transaksi = await prisma.transaksi.findMany({
        include: {
            barang: {
                include: { kategori: true }
            }
        },
        orderBy: { tanggal: 'desc' }
    })
    return NextResponse.json(transaksi)
}

// POST - Tambah transaksi
export async function POST(request: NextRequest) {
    const cookieStore = await cookies()
    const token = cookieStore.get('token')?.value

    if (!token || !verifyToken(token)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        const { barangId, tipe, jumlah, tanggal } = await request.json()

        if (!barangId || !tipe || !jumlah) {
            return NextResponse.json({ error: 'Data tidak lengkap' }, { status: 400 })
        }

        const barang = await prisma.barang.findUnique({ where: { id: barangId } })
        if (!barang) {
            return NextResponse.json({ error: 'Barang tidak ditemukan' }, { status: 404 })
        }

        // Update stok barang
        const stokBaru = tipe === 'BELI'
            ? barang.stok + jumlah
            : barang.stok - jumlah

        if (stokBaru < 0) {
            return NextResponse.json({ error: 'Stok tidak mencukupi' }, { status: 400 })
        }

        // Buat transaksi dan update stok dalam satu transaksi
        const [transaksi] = await prisma.$transaction([
            prisma.transaksi.create({
                data: {
                    barangId,
                    tipe,
                    jumlah,
                    tanggal: tanggal ? new Date(tanggal) : new Date()
                },
                include: {
                    barang: {
                        include: { kategori: true }
                    }
                }
            }),
            prisma.barang.update({
                where: { id: barangId },
                data: { stok: stokBaru }
            })
        ])

        return NextResponse.json(transaksi, { status: 201 })
    } catch (error) {
        console.error('Create transaksi error:', error)
        return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 })
    }
}
