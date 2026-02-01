import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'
import { cookies } from 'next/headers'

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

        // Cek transaksi lama
        const transaksi = await prisma.transaksi.findUnique({
            where: { id },
            include: { barang: true }
        })

        if (!transaksi) {
            return NextResponse.json({ error: 'Transaksi tidak ditemukan' }, { status: 404 })
        }

        // Kembalikan stok
        // Jika JUAL, stok dikembalikan (ditambah)
        // Jika BELI, stok dikurangi (karena batal beli)
        const stokBaru = transaksi.tipe === 'JUAL'
            ? transaksi.barang.stok + transaksi.jumlah
            : transaksi.barang.stok - transaksi.jumlah

        if (stokBaru < 0) {
            return NextResponse.json({ error: 'Stok barang menjadi negatif jika transaksi dihapus' }, { status: 400 })
        }

        await prisma.$transaction([
            prisma.barang.update({
                where: { id: transaksi.barangId },
                data: { stok: stokBaru }
            }),
            prisma.transaksi.delete({ where: { id } })
        ])

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Delete transaksi error:', error)
        return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 })
    }
}

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
        const { tipe, jumlah, tanggal } = await request.json()

        // 1. Ambil transaksi lama
        const oldTrans = await prisma.transaksi.findUnique({
            where: { id },
            include: { barang: true }
        })

        if (!oldTrans) {
            return NextResponse.json({ error: 'Transaksi tidak ditemukan' }, { status: 404 })
        }

        // 2. Revert stok lama
        // JUAL -> + jumlah lama
        // BELI -> - jumlah lama
        let currentStok = oldTrans.tipe === 'JUAL'
            ? oldTrans.barang.stok + oldTrans.jumlah
            : oldTrans.barang.stok - oldTrans.jumlah

        // 3. Apply stok baru
        // JUAL -> - jumlah baru
        // BELI -> + jumlah baru
        // (Asumsi barangId tidak berubah, untuk simplifikasi)

        let finalStok = currentStok
        if (tipe === 'JUAL') {
            finalStok = currentStok - jumlah
        } else {
            finalStok = currentStok + jumlah
        }

        if (finalStok < 0) {
            return NextResponse.json({ error: 'Stok tidak mencukupi untuk update ini' }, { status: 400 })
        }

        const [updatedTrans] = await prisma.$transaction([
            prisma.barang.update({
                where: { id: oldTrans.barangId },
                data: { stok: finalStok }
            }),
            prisma.transaksi.update({
                where: { id },
                data: {
                    tipe,
                    jumlah,
                    tanggal: new Date(tanggal)
                },
                include: { barang: true }
            })
        ])

        return NextResponse.json(updatedTrans)

    } catch (error) {
        console.error('Update transaksi error:', error)
        return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 })
    }
}
