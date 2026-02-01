import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'
import { cookies } from 'next/headers'

interface TransaksiData {
    tanggal: Date
    jumlah: number
}

interface PenjualanMingguan {
    minggu: string
    totalJual: number
}

// Helper functions untuk ISO 8601 week calculation
function getISOWeek(date: Date): number {
    const target = new Date(date.valueOf())
    const dayNr = (date.getDay() + 6) % 7 // Senin = 0
    target.setDate(target.getDate() - dayNr + 3)
    const firstThursday = target.valueOf()
    target.setMonth(0, 1)
    if (target.getDay() !== 4) {
        target.setMonth(0, 1 + ((4 - target.getDay()) + 7) % 7)
    }
    return 1 + Math.ceil((firstThursday - target.valueOf()) / 604800000)
}

function getISOWeekYear(date: Date): number {
    const target = new Date(date.valueOf())
    target.setDate(target.getDate() - ((date.getDay() + 6) % 7) + 3)
    return target.getFullYear()
}

export async function POST(request: NextRequest) {
    const cookieStore = await cookies()
    const token = cookieStore.get('token')?.value
    const user = token ? verifyToken(token) : null

    if (!user || user.role !== 'OWNER') {
        return NextResponse.json({ error: 'Hanya owner yang dapat mengakses' }, { status: 403 })
    }

    try {
        let body;
        try {
            body = await request.json()
        } catch (e) {
            return NextResponse.json({ error: 'Invalid JSON request body' }, { status: 400 })
        }

        const { tanggalMulai, tanggalAkhir, window, leadTime } = body

        if (!tanggalMulai || !tanggalAkhir) {
            return NextResponse.json({ error: 'Periode (tanggalMulai, tanggalAkhir) wajib diisi' }, { status: 400 })
        }

        // Validate date validity
        const startDate = new Date(tanggalMulai)
        const endDate = new Date(tanggalAkhir)

        if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
            return NextResponse.json({ error: 'Format tanggal tidak valid' }, { status: 400 })
        }

        if (startDate > endDate) {
            return NextResponse.json({ error: 'Tanggal mulai tidak boleh lebih besar dari tanggal akhir' }, { status: 400 })
        }

        endDate.setHours(23, 59, 59, 999)

        const diffTime = Math.abs(endDate.getTime() - startDate.getTime())
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
        const calculatedWindow = Math.max(2, Math.ceil(diffDays / 7)) // Minimum 2 minggu, bulatkan ke atas

        // Default values
        const windowSize = calculatedWindow // Auto-calculated dalam minggu
        const fixedLeadTime = leadTime || 7 // Default 7 hari

        // Ambil semua barang
        const barangList = await prisma.barang.findMany({
            include: { kategori: true },
            orderBy: { kode: 'asc' }
        })

        // Proses setiap barang
        const hasil = await Promise.all(
            barangList.map(async (barang, index) => {
                // Ambil transaksi JUAL dalam periode
                const transaksiJual = await prisma.transaksi.findMany({
                    where: {
                        barangId: barang.id,
                        tipe: 'JUAL',
                        tanggal: {
                            gte: startDate,
                            lte: endDate
                        }
                    },
                    orderBy: { tanggal: 'asc' }
                })

                // Jika tidak ada transaksi, return dengan nilai 0
                if (transaksiJual.length === 0) {
                    return {
                        no: index + 1,
                        kode: barang.kode,
                        nama: barang.nama,
                        kategoriNama: barang.kategori?.nama || '-',
                        satuan: barang.satuan || 'Pcs',
                        peramalan: 0,
                        safetyStock: 0,
                        stokSaatIni: barang.stok,
                        rekomendasiPembelian: 0,
                        mape: 0,
                        keterangan: 'Tidak ada data transaksi'
                    }
                }

                // Kelompokkan transaksi per minggu
                const penjualanPerMinggu = groupByWeek(transaksiJual)

                // Jika jumlah minggu < window, gunakan semua data yang ada
                const actualWindow = Math.min(windowSize, penjualanPerMinggu.length)

                if (actualWindow === 0) {
                    return {
                        no: index + 1,
                        kode: barang.kode,
                        nama: barang.nama,
                        kategoriNama: barang.kategori?.nama || '-',
                        satuan: barang.satuan || 'Pcs',
                        peramalan: 0,
                        safetyStock: 0,
                        stokSaatIni: barang.stok,
                        rekomendasiPembelian: 0,
                        mape: 0,
                        keterangan: 'Data tidak cukup untuk peramalan'
                    }
                }

                // Ambil N periode terakhir untuk SMA
                const lastNPeriods = penjualanPerMinggu.slice(-actualWindow)

                // Hitung SMA (Simple Moving Average)
                const totalPenjualan = lastNPeriods.reduce((sum, period) => sum + period.totalJual, 0)
                const sma = Math.round(totalPenjualan / actualWindow)

                // Hitung penjualan harian
                const hariDalamPeriode = calculateDaysInPeriod(startDate, endDate)
                const totalJualSeluruhPeriode = transaksiJual.reduce((sum, t) => sum + t.jumlah, 0)
                const rataRataPenjualanHarian = totalJualSeluruhPeriode / hariDalamPeriode

                // Hitung penjualan harian tertinggi (ambil dari minggu dengan penjualan tertinggi)
                const maxPenjualanMingguan = Math.max(...penjualanPerMinggu.map(p => p.totalJual))
                const hariDalamMinggu = 7 // Standar minggu
                const penjualanHarianTertinggi = maxPenjualanMingguan / hariDalamMinggu

                // Gunakan lead time dari barang, atau gunakan fixed lead time
                const leadTimeDays = barang.leadTime || fixedLeadTime

                // Hitung rata-rata lead time (dalam kasus sederhana, sama dengan lead time)
                const avgLeadTime = leadTimeDays

                // Hitung Safety Stock
                // SS = (Penjualan Harian Tertinggi × Lead Time Terlama) - (Rata-Rata Penjualan Harian × Rata-Rata Lead Time)
                const safetyStock = Math.max(
                    0,
                    Math.round((penjualanHarianTertinggi * leadTimeDays) - (rataRataPenjualanHarian * avgLeadTime))
                )

                // Hitung Rekomendasi Pembelian
                // Q = (SMA + SS) - S
                const rekomendasiPembelian = Math.max(0, (sma + safetyStock) - barang.stok)

                // ============================================
                // PERBAIKAN MAPE - METODE ROLLING FORECAST
                // ============================================
                let mape = 0

                // Minimal butuh window + 1 minggu untuk bisa hitung MAPE
                // (window untuk forecast, 1 untuk validation)
                if (penjualanPerMinggu.length >= actualWindow + 1) {
                    let totalPercentageError = 0
                    let validCount = 0

                    // Iterasi dari minggu ke-(window) sampai minggu terakhir
                    // Setiap iterasi: gunakan N minggu sebelumnya untuk forecast, 
                    // bandingkan dengan actual minggu ini
                    for (let i = actualWindow; i < penjualanPerMinggu.length; i++) {
                        const actual = penjualanPerMinggu[i].totalJual

                        if (actual > 0) {
                            // Ambil data window minggu sebelumnya untuk forecast
                            const forecastData = penjualanPerMinggu.slice(i - actualWindow, i)
                            const forecast = forecastData.reduce((sum, p) => sum + p.totalJual, 0) / actualWindow

                            // Hitung absolute percentage error
                            const percentageError = Math.abs((actual - forecast) / actual)
                            totalPercentageError += percentageError
                            validCount++
                        }
                    }

                    if (validCount > 0) {
                        mape = Math.round((totalPercentageError / validCount) * 100) // Dalam persen
                    }
                } else if (penjualanPerMinggu.length === actualWindow && actualWindow >= 3) {
                    // ALTERNATIF: Jika data pas = window, gunakan metode Leave-One-Out
                    // Hitung forecast dengan menghilangkan satu data, lalu bandingkan
                    let totalPercentageError = 0
                    let validCount = 0

                    for (let i = 0; i < penjualanPerMinggu.length; i++) {
                        const actual = penjualanPerMinggu[i].totalJual

                        if (actual > 0) {
                            // Forecast menggunakan data lain (exclude data ke-i)
                            const forecastData = penjualanPerMinggu.filter((_, idx) => idx !== i)
                            const forecast = forecastData.reduce((sum, p) => sum + p.totalJual, 0) / forecastData.length

                            const percentageError = Math.abs((actual - forecast) / actual)
                            totalPercentageError += percentageError
                            validCount++
                        }
                    }

                    if (validCount > 0) {
                        mape = Math.round((totalPercentageError / validCount) * 100)
                    }
                }

                return {
                    no: index + 1,
                    kode: barang.kode,
                    nama: barang.nama,
                    kategoriNama: barang.kategori?.nama || '-',
                    satuan: barang.satuan || 'Pcs',
                    peramalan: sma,
                    safetyStock: safetyStock,
                    stokSaatIni: barang.stok,
                    rekomendasiPembelian: rekomendasiPembelian,
                    mape: mape,
                    keterangan: rekomendasiPembelian > 0 ? 'Perlu restock' : 'Stok mencukupi'
                }
            })
        )

        return NextResponse.json({
            periode: {
                mulai: tanggalMulai,
                akhir: tanggalAkhir
            },
            parameter: {
                window: windowSize,
                leadTime: fixedLeadTime
            },
            data: hasil
        })
    } catch (error: any) {
        console.error('Perhitungan error:', error)
        return NextResponse.json({
            error: 'Terjadi kesalahan server',
            detail: error?.message || 'Unknown error'
        }, { status: 500 })
    }
}

// Helper function: Kelompokkan transaksi per minggu (ISO 8601)
function groupByWeek(transaksi: TransaksiData[]): PenjualanMingguan[] {
    const grouped: { [key: string]: number } = {}

    transaksi.forEach(t => {
        const date = new Date(t.tanggal)
        const year = getISOWeekYear(date)
        const week = getISOWeek(date)
        const weekKey = `${year}-W${String(week).padStart(2, '0')}`

        if (!grouped[weekKey]) {
            grouped[weekKey] = 0
        }
        grouped[weekKey] += t.jumlah
    })

    return Object.entries(grouped)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([minggu, totalJual]) => ({ minggu, totalJual }))
}

// Helper function: Hitung jumlah hari dalam periode
function calculateDaysInPeriod(startDate: Date, endDate: Date): number {
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return Math.max(1, diffDays)
}