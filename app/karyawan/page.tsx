'use client'

import { useEffect, useState } from 'react'

interface DashboardStats {
    totalBarang: number
    totalTransaksi: number
    transaksiHariIni: number
}

export default function KaryawanDashboard() {
    const [stats, setStats] = useState<DashboardStats>({
        totalBarang: 0,
        totalTransaksi: 0,
        transaksiHariIni: 0
    })

    useEffect(() => {
        loadStats()
    }, [])

    const loadStats = async () => {
        try {
            const [barangRes, transaksiRes] = await Promise.all([
                fetch('/api/barang'),
                fetch('/api/transaksi')
            ])

            if (!barangRes.ok || !transaksiRes.ok) {
                if (barangRes.status === 401 || transaksiRes.status === 401) {
                    // Token expired/invalid, let middleware/layout handle redirect
                    // Suppress error log
                    return
                }
                console.error(`Fetch failed. Barang: ${barangRes.status}, Transaksi: ${transaksiRes.status}`)
                if (!barangRes.ok) console.error('Barang Error:', await barangRes.text())
                if (!transaksiRes.ok) console.error('Transaksi Error:', await transaksiRes.text())
                return
            }

            const barang = await barangRes.json()
            const transaksi = await transaksiRes.json()

            // Ensure data is array before processing
            if (!Array.isArray(transaksi) || !Array.isArray(barang)) {
                console.error('Invalid data format')
                return
            }

            const today = new Date().toDateString()
            const transaksiHariIni = transaksi.filter(
                (t: { tanggal: string }) => new Date(t.tanggal).toDateString() === today
            ).length

            setStats({
                totalBarang: barang.length,
                totalTransaksi: transaksi.length,
                transaksiHariIni
            })
        } catch (error) {
            console.error('Load stats error:', error)
        }
    }

    const statCards = [
        { label: 'Total Barang', value: stats.totalBarang, color: 'from-blue-600 to-blue-400' },
        { label: 'Total Transaksi', value: stats.totalTransaksi, color: 'from-green-600 to-green-400' },
        { label: 'Transaksi Hari Ini', value: stats.transaksiHariIni, color: 'from-purple-600 to-purple-400' },
    ]

    return (
        <div className="space-y-8">
            <h1 className="text-2xl font-bold text-white">Dashboard Karyawan</h1>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {statCards.map((stat) => (
                    <div
                        key={stat.label}
                        className={`p-6 rounded-2xl bg-gradient-to-br ${stat.color} shadow-lg`}
                    >
                        <p className="text-white/80 text-sm">{stat.label}</p>
                        <p className="text-4xl font-bold text-white mt-2">{stat.value}</p>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <a
                    href="/karyawan/barang"
                    className="p-6 bg-white/5 backdrop-blur rounded-2xl border border-white/10 hover:bg-white/10 transition group"
                >
                    <h3 className="text-lg font-semibold text-white group-hover:text-blue-400 transition">
                        Kelola Data Barang
                    </h3>
                    <p className="text-slate-400 mt-2">
                        Tambah, edit, dan hapus data barang
                    </p>
                </a>

                <a
                    href="/karyawan/transaksi"
                    className="p-6 bg-white/5 backdrop-blur rounded-2xl border border-white/10 hover:bg-white/10 transition group"
                >
                    <h3 className="text-lg font-semibold text-white group-hover:text-green-400 transition">
                        Input Transaksi
                    </h3>
                    <p className="text-slate-400 mt-2">
                        Catat transaksi penjualan dan pembelian
                    </p>
                </a>
            </div>
        </div>
    )
}
