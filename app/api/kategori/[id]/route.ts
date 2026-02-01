import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'
import { cookies } from 'next/headers'

// GET - Detail kategori
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
    const kategori = await prisma.kategori.findUnique({
        where: { id },
        include: {
            barang: true
        }
    })

    if (!kategori) {
        return NextResponse.json({ error: 'Kategori tidak ditemukan' }, { status: 404 })
    }

    return NextResponse.json(kategori)
}

// PUT - Update kategori
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
        const { nama } = await request.json()

        if (!nama) {
            return NextResponse.json({ error: 'Nama kategori wajib diisi' }, { status: 400 })
        }

        const kategori = await prisma.kategori.update({
            where: { id },
            data: { nama }
        })

        return NextResponse.json(kategori)
    } catch (error) {
        console.error('Update kategori error:', error)
        return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 })
    }
}

// DELETE - Hapus kategori
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

        // Set kategoriId to null for all barang in this kategori
        await prisma.barang.updateMany({
            where: { kategoriId: id },
            data: { kategoriId: null }
        })

        await prisma.kategori.delete({ where: { id } })
        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Delete kategori error:', error)
        return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 })
    }
}
