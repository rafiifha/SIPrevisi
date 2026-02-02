'use client'

import { useEffect, useState } from 'react'

interface Kategori {
    id: string
    nama: string
}

interface Barang {
    id: string
    kode: string
    nama: string
    stok: number
    satuan?: string
    kategori?: Kategori | null
}

interface Transaksi {
    id: string
    barangId: string
    barang: Barang
    tipe: 'JUAL' | 'BELI'
    jumlah: number
    tanggal: string
}

export default function OwnerTransaksiPage() {
    const [transaksi, setTransaksi] = useState<Transaksi[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        loadData()
    }, [])

    const loadData = async () => {
        try {
            const transaksiRes = await fetch('/api/transaksi')

            if (!transaksiRes.ok) {
                if (transaksiRes.status === 401) {
                    return
                }
                console.error('Failed to fetch transaksi:', await transaksiRes.text())
                return
            }

            const transaksiData = await transaksiRes.json()

            if (Array.isArray(transaksiData)) setTransaksi(transaksiData)
            else setTransaksi([])
        } catch (error) {
            console.error('Load data error:', error)
        } finally {
            setLoading(false)
        }
    }

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        })
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-white">Data Transaksi</h1>
            </div>

            <div className="bg-white/5 backdrop-blur rounded-2xl border border-white/10 overflow-hidden">
                <table className="w-full">
                    <thead>
                        <tr className="bg-white/5">
                            <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">No</th>
                            <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Tanggal</th>
                            <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Barang</th>
                            <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Kategori</th>
                            <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Tipe</th>
                            <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Jumlah</th>
                            <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Satuan</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan={7} className="px-6 py-8 text-center text-slate-400">
                                    Memuat data...
                                </td>
                            </tr>
                        ) : transaksi.length === 0 ? (
                            <tr>
                                <td colSpan={7} className="px-6 py-8 text-center text-slate-400">
                                    Belum ada transaksi
                                </td>
                            </tr>
                        ) : (
                            transaksi.map((t, index) => (
                                <tr key={t.id} className="border-t border-white/5 hover:bg-white/5">
                                    <td className="px-6 py-4 text-slate-300">{index + 1}</td>
                                    <td className="px-6 py-4 text-slate-300">{formatDate(t.tanggal)}</td>
                                    <td className="px-6 py-4 text-white">
                                        <span className="font-mono text-slate-400">{t.barang.kode}</span> - {t.barang.nama}
                                    </td>
                                    <td className="px-6 py-4 text-slate-300">
                                        {t.barang.kategori ? (
                                            <span className="px-2 py-1 bg-purple-600/20 border border-purple-500/30 rounded-full text-purple-300 text-xs">
                                                {t.barang.kategori.nama}
                                            </span>
                                        ) : (
                                            <span className="text-slate-500">-</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 rounded text-xs font-medium ${t.tipe === 'JUAL'
                                            ? 'bg-red-500/20 text-red-300'
                                            : 'bg-green-500/20 text-green-300'
                                            }`}>
                                            {t.tipe === 'JUAL' ? 'Penjualan' : 'Pembelian'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-slate-300">{t.jumlah}</td>
                                    <td className="px-6 py-4 text-slate-300">{t.barang.satuan || 'Pcs'}</td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
