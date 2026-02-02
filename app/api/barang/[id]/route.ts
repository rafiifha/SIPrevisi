import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'

import { cookies } from 'next/headers'

// GET - Detail barang
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const cookieStore = await cookies()
    const token = cookieStore.get('token')?.value

    if (!token || !verifyToken(token)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const barang = await prisma.barang.findUnique({ where: { id } })

    if (!barang) {
        return NextResponse.json({ error: 'Barang tidak ditemukan' }, { status: 404 })
    }

    return NextResponse.json(barang)
}

// PUT - Update barang
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const cookieStore = await cookies()
    const token = cookieStore.get('token')?.value

    if (!token || !verifyToken(token)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        const { id } = await params
        const { kode, nama, stok, kategoriId, satuan, leadTime } = await request.json()

        const barang = await prisma.barang.update({
            where: { id },
            data: {
                kode,
                nama,
                stok,
                satuan: satuan || undefined,
                leadTime: leadTime !== undefined ? leadTime : undefined,
                kategoriId: kategoriId || null
            },
            include: { kategori: true }
        })

        return NextResponse.json(barang)
    } catch (error) {
        console.error('Update barang error:', error)
        return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 })
    }
}

// DELETE - Hapus barang
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const cookieStore = await cookies()
    const token = cookieStore.get('token')?.value

    if (!token || !verifyToken(token)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        const { id } = await params

        // Check if barang has transactions
        const transactionCount = await prisma.transaksi.count({
            where: { barangId: id }
        })

        if (transactionCount > 0) {
            return NextResponse.json(
                { error: 'Barang tidak dapat dihapus karena sudah memiliki data transaksi. Silakan hapus transaksi terkait terlebih dahulu.' },
                { status: 400 }
            )
        }

        await prisma.barang.delete({ where: { id } })
        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Delete barang error:', error)
        return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 })
    }
}
