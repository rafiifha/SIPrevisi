'use client'

import { useEffect, useState } from 'react'

interface Kategori {
    id: string
    nama: string
    _count?: {
        barang: number
    }
}

interface Barang {
    id: string
    kode: string
    nama: string
    stok: number
    satuan: string
    kategoriId: string | null
    kategori: Kategori | null
}

export default function OwnerBarangPage() {
    const [barang, setBarang] = useState<Barang[]>([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')

    useEffect(() => {
        loadBarang()
    }, [])

    const loadBarang = async () => {
        try {
            const res = await fetch('/api/barang')
            if (!res.ok) {
                if (res.status === 401) return
                console.error('Failed to fetch barang:', await res.text())
                return
            }
            const data = await res.json()

            if (Array.isArray(data)) {
                setBarang(data)
            } else {
                console.error('Invalid data format received', data)
                setBarang([])
            }
        } catch (error) {
            console.error('Load barang error:', error)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-white">Data Barang</h1>
            </div>

            {/* Search Bar */}
            <div className="flex items-center gap-4">
                <div className="relative flex-1 max-w-md">
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Cari barang"
                        className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                        <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </div>
                </div>
            </div>

            {/* Tabel Barang */}
            <div className="bg-white/5 backdrop-blur rounded-2xl border border-white/10 overflow-hidden">
                <table className="w-full">
                    <thead>
                        <tr className="bg-white/5">
                            <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">No</th>
                            <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Kode</th>
                            <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Nama Barang</th>
                            <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Kategori</th>
                            <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Stok</th>
                            <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Satuan</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan={6} className="px-6 py-8 text-center text-slate-400">
                                    Memuat data...
                                </td>
                            </tr>
                        ) : barang.filter(item =>
                            item.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            item.kode.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            item.kategori?.nama.toLowerCase().includes(searchQuery.toLowerCase())
                        ).length === 0 ? (
                            <tr>
                                <td colSpan={6} className="px-6 py-8 text-center text-slate-400">
                                    {searchQuery ? 'Tidak ada barang yang cocok' : 'Belum ada data barang'}
                                </td>
                            </tr>
                        ) : (
                            barang.filter(item =>
                                item.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                item.kode.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                item.kategori?.nama.toLowerCase().includes(searchQuery.toLowerCase())
                            ).map((item, index) => (
                                <tr key={item.id} className="border-t border-white/5 hover:bg-white/5">
                                    <td className="px-6 py-4 text-slate-300">{index + 1}</td>
                                    <td className="px-6 py-4 text-slate-300 font-mono">{item.kode}</td>
                                    <td className="px-6 py-4 text-white">{item.nama}</td>
                                    <td className="px-6 py-4">
                                        {item.kategori ? (
                                            <span className="px-2 py-1 bg-purple-600/20 border border-purple-500/30 rounded-full text-purple-300 text-sm">
                                                {item.kategori.nama}
                                            </span>
                                        ) : (
                                            <span className="text-slate-500 text-sm">-</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-slate-300">{item.stok}</td>
                                    <td className="px-6 py-4 text-slate-300">{item.satuan}</td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
