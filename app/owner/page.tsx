'use client'

import { useState, useEffect } from 'react'
import ConfirmModal from '@/components/ConfirmModal'

interface HasilPerhitungan {
    no: number
    kode: string
    nama: string
    kategoriNama: string
    satuan: string
    peramalan: number
    safetyStock: number
    stokSaatIni: number
    rekomendasiPembelian: number
    mape: number
    keterangan?: string
}

interface PerhitunganResponse {
    periode: {
        mulai: string
        akhir: string
    }
    parameter: {
        window: number
        leadTime: number
    }
    data: HasilPerhitungan[]
}

export default function OwnerPage() {
    const [tanggalMulai, setTanggalMulai] = useState('')
    const [tanggalAkhir, setTanggalAkhir] = useState('')
    const [window, setWindow] = useState(4) // Default 4 minggu (auto-calculated)
    const [leadTime, setLeadTime] = useState(7) // Default 7 hari
    const [searchQuery, setSearchQuery] = useState('')
    const [hasil, setHasil] = useState<PerhitunganResponse | null>(null)
    const [loading, setLoading] = useState(false)

    // Modal state
    const [confirmModal, setConfirmModal] = useState<{
        isOpen: boolean;
        title: string;
        description: string;
        variant: 'success' | 'error' | 'info' | 'danger';
        isAlert: boolean;
        autoClose?: boolean;
        onConfirm: () => void;
    }>({
        isOpen: false,
        title: '',
        description: '',
        variant: 'info',
        isAlert: true,
        autoClose: false,
        onConfirm: () => { }
    })

    // Auto-calculate window based on date range
    useEffect(() => {
        if (tanggalMulai && tanggalAkhir) {
            const start = new Date(tanggalMulai)
            const end = new Date(tanggalAkhir)

            if (end >= start) {
                const diffTime = Math.abs(end.getTime() - start.getTime())
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
                const calculatedWindow = Math.max(2, Math.ceil(diffDays / 7)) // Minimum 2 minggu, bulatkan ke atas
                setWindow(calculatedWindow)
            }
        }
    }, [tanggalMulai, tanggalAkhir])

    const handleHitung = async () => {
        if (!tanggalMulai || !tanggalAkhir) {
            setConfirmModal({
                isOpen: true,
                title: 'Pilih Periode',
                description: 'Silakan pilih tanggal mulai dan tanggal akhir terlebih dahulu.',
                variant: 'error',
                isAlert: true,
                onConfirm: () => setConfirmModal(prev => ({ ...prev, isOpen: false }))
            })
            return
        }

        // Validasi tanggal
        const start = new Date(tanggalMulai)
        const end = new Date(tanggalAkhir)

        if (end < start) {
            setConfirmModal({
                isOpen: true,
                title: 'Tanggal Tidak Valid',
                description: 'Tanggal akhir harus lebih besar atau sama dengan tanggal mulai.',
                variant: 'error',
                isAlert: true,
                onConfirm: () => setConfirmModal(prev => ({ ...prev, isOpen: false }))
            })
            return
        }

        if (window < 2) {
            setConfirmModal({
                isOpen: true,
                title: 'Window Tidak Valid',
                description: 'Window SMA minimal 2 minggu.',
                variant: 'error',
                isAlert: true,
                onConfirm: () => setConfirmModal(prev => ({ ...prev, isOpen: false }))
            })
            return
        }

        if (leadTime < 1) {
            setConfirmModal({
                isOpen: true,
                title: 'Lead Time Tidak Valid',
                description: 'Lead time minimal 1 hari.',
                variant: 'error',
                isAlert: true,
                onConfirm: () => setConfirmModal(prev => ({ ...prev, isOpen: false }))
            })
            return
        }

        setLoading(true)

        try {
            const res = await fetch('/api/perhitungan', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    tanggalMulai,
                    tanggalAkhir,
                    window,
                    leadTime
                })
            })

            if (!res.ok) {
                const data = await res.json()
                setConfirmModal({
                    isOpen: true,
                    title: 'Gagal',
                    description: data.error || 'Gagal menghitung kebutuhan stok',
                    variant: 'error',
                    isAlert: true,
                    onConfirm: () => setConfirmModal(prev => ({ ...prev, isOpen: false }))
                })
                return
            }

            const data = await res.json()
            setHasil(data)
            setConfirmModal({
                isOpen: true,
                title: 'Berhasil',
                description: 'Analisis kebutuhan stok selesai!',
                variant: 'success',
                isAlert: true,
                autoClose: true,
                onConfirm: () => setConfirmModal(prev => ({ ...prev, isOpen: false, autoClose: false }))
            })
        } catch {
            setConfirmModal({
                isOpen: true,
                title: 'Kesalahan Koneksi',
                description: 'Terjadi kesalahan saat menghubungi server.',
                variant: 'error',
                isAlert: true,
                onConfirm: () => setConfirmModal(prev => ({ ...prev, isOpen: false }))
            })
        } finally {
            setLoading(false)
        }
    }

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        })
    }

    // Hitung rata-rata MAPE
    const averageMAPE = hasil ?
        Math.round(hasil.data.reduce((sum, item) => sum + item.mape, 0) / hasil.data.length) : 0

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-2xl font-bold text-white">Perencanaan Stok</h1>
                <p className="text-slate-400 mt-1">
                    Hitung kebutuhan stok berdasarkan data penjualan
                </p>
            </div>

            <div className="p-6 bg-white/5 backdrop-blur rounded-2xl border border-white/10">
                <h2 className="text-lg font-semibold text-white mb-4">Parameter Perhitungan</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                    <div>
                        <label className="block text-sm text-slate-400 mb-2">Tanggal Mulai</label>
                        <input
                            type="date"
                            value={tanggalMulai}
                            onChange={(e) => setTanggalMulai(e.target.value)}
                            className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm text-slate-400 mb-2">Tanggal Akhir</label>
                        <input
                            type="date"
                            value={tanggalAkhir}
                            onChange={(e) => setTanggalAkhir(e.target.value)}
                            className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm text-slate-400 mb-2">
                            Periode (Minggu)
                        </label>
                        <input
                            type="number"
                            value={window}
                            readOnly
                            disabled
                            className="w-full px-4 py-2 bg-slate-700/50 border border-white/10 rounded-lg text-white cursor-not-allowed"
                        />
                    </div>
                    <div>
                        <label className="block text-sm text-slate-400 mb-2">
                            Lead Time (Hari)
                            <span className="ml-1 text-xs text-slate-500">*</span>
                        </label>
                        <input
                            type="number"
                            min="1"
                            max="90"
                            value={leadTime}
                            onChange={(e) => setLeadTime(parseInt(e.target.value) || 1)}
                            className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                        <p className="text-xs text-slate-500 mt-1">Waktu tunggu supplier</p>
                    </div>
                </div>

                <button
                    onClick={handleHitung}
                    disabled={loading}
                    className="w-full md:w-auto px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 text-white font-semibold rounded-lg transition disabled:opacity-50"
                >
                    {loading ? 'Menghitung...' : 'Hitung Sekarang'}
                </button>

                <div className="mt-4 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                    <p className="text-sm text-blue-300">
                        <strong>Info:</strong> Periode (minggu) adalah waktu yang digunakan untuk perhitungan rata-rata bergerak.
                        Periode akan otomatis dihitung berdasarkan rentang tanggal yang Anda pilih (minimum 2 minggu).
                        Lead Time adalah waktu tunggu dari pemesanan hingga barang datang.
                    </p>
                </div>
            </div>

            {hasil && (
                <div className="space-y-4">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <h2 className="text-lg font-semibold text-white">Hasil Perhitungan</h2>
                            <p className="text-sm text-slate-400 mt-1">
                                Rentang Tanggal : {formatDate(hasil.periode.mulai)} - {formatDate(hasil.periode.akhir)} |
                                Periode: {hasil.parameter.window} minggu |
                                Lead Time: {hasil.parameter.leadTime} hari
                            </p>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="px-4 py-2 bg-purple-500/20 border border-purple-500/30 rounded-lg">
                                <p className="text-xs text-purple-300">Rata-rata MAPE</p>
                                <p className="text-2xl font-bold text-purple-200">{averageMAPE}%</p>
                            </div>
                            <div className="relative flex-1 max-w-md">
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Cari barang..."
                                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                                />
                                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                                    <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                    </svg>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white/5 backdrop-blur rounded-2xl border border-white/10 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="bg-white/5">
                                        <th className="px-4 py-4 text-left text-sm font-semibold text-slate-300">No</th>
                                        <th className="px-4 py-4 text-left text-sm font-semibold text-slate-300">Kode</th>
                                        <th className="px-4 py-4 text-left text-sm font-semibold text-slate-300">Nama Barang</th>
                                        <th className="px-4 py-4 text-left text-sm font-semibold text-slate-300">Kategori</th>
                                        <th className="px-4 py-4 text-center text-sm font-semibold text-slate-300">Peramalan</th>
                                        <th className="px-4 py-4 text-center text-sm font-semibold text-slate-300">Safety Stock</th>
                                        <th className="px-4 py-4 text-center text-sm font-semibold text-slate-300">Sisa Stock</th>
                                        <th className="px-4 py-4 text-center text-sm font-semibold text-slate-300">Rekomendasi</th>
                                        <th className="px-4 py-4 text-center text-sm font-semibold text-slate-300">MAPE (%)</th>
                                        <th className="px-4 py-4 text-center text-sm font-semibold text-slate-300">Satuan</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {hasil.data.filter(item =>
                                        item.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                        item.kode.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                        item.kategoriNama.toLowerCase().includes(searchQuery.toLowerCase())
                                    ).length === 0 ? (
                                        <tr>
                                            <td colSpan={10} className="px-4 py-8 text-center text-slate-400">
                                                {searchQuery ? 'Tidak ada data barang yang sesuai' : 'Tidak ada data barang'}
                                            </td>
                                        </tr>
                                    ) : (
                                        hasil.data.filter(item =>
                                            item.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                            item.kode.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                            item.kategoriNama.toLowerCase().includes(searchQuery.toLowerCase())
                                        ).map((item) => (
                                            <tr key={item.kode} className="border-t border-white/5 hover:bg-white/5">
                                                <td className="px-4 py-4 text-slate-300">{item.no}</td>
                                                <td className="px-4 py-4 text-slate-300 font-mono">{item.kode}</td>
                                                <td className="px-4 py-4 text-white">{item.nama}</td>
                                                <td className="px-4 py-4 text-center">
                                                    <span className="px-2 py-1 bg-purple-600/20 border border-purple-500/30 rounded-full text-purple-300 text-xs">
                                                        {item.kategoriNama}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-4 text-center text-slate-300 font-semibold">{item.peramalan}</td>
                                                <td className="px-4 py-4 text-center text-slate-300">{item.safetyStock}</td>
                                                <td className="px-4 py-4 text-center text-slate-300">{item.stokSaatIni}</td>
                                                <td className="px-4 py-4 text-center">
                                                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${item.rekomendasiPembelian > 0
                                                        ? 'bg-orange-500/20 text-orange-300 border border-orange-500/30'
                                                        : 'bg-green-500/20 text-green-300 border border-green-500/30'
                                                        }`}>
                                                        {item.rekomendasiPembelian}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-4 text-center">
                                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${item.mape === 0 ? 'bg-slate-500/20 text-slate-400' :
                                                            item.mape < 20 ? 'bg-green-500/20 text-green-300' :
                                                                item.mape < 50 ? 'bg-yellow-500/20 text-yellow-300' :
                                                                    'bg-red-500/20 text-red-300'
                                                        }`}>
                                                        {item.mape}%
                                                    </span>
                                                </td>
                                                <td className="px-4 py-4 text-center text-slate-300">{item.satuan}</td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className="p-4 bg-slate-800/50 border border-slate-700 rounded-lg">
                        <h3 className="text-sm font-semibold text-white mb-2">Interpretasi MAPE:</h3>
                        <h6 className="text-xs text-slate-300">MAPE digunakan untuk mengukur tingkat keakuratan hasil peramalan.</h6>
                        <br />
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 bg-green-500 rounded"></div>
                                <span className="text-slate-300">&lt; 20%: Sangat Baik</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 bg-yellow-500 rounded"></div>
                                <span className="text-slate-300">20-50%: Cukup Baik</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 bg-red-500 rounded"></div>
                                <span className="text-slate-300">&gt; 50%: Kurang Akurat</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 bg-slate-500 rounded"></div>
                                <span className="text-slate-300">0%: Tidak ada data</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <ConfirmModal
                isOpen={confirmModal.isOpen}
                title={confirmModal.title}
                description={confirmModal.description}
                variant={confirmModal.variant}
                isAlert={confirmModal.isAlert}
                autoClose={confirmModal.autoClose}
                onConfirm={confirmModal.onConfirm}
                onCancel={() => setConfirmModal(prev => ({ ...prev, isOpen: false, autoClose: false }))}
                confirmText="Tutup"
            />
        </div>
    )
}
