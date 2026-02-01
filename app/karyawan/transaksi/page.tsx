'use client'

import { useEffect, useState, useRef } from 'react'
import { toast } from 'sonner'
import ConfirmModal from '@/components/ConfirmModal'

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

export default function TransaksiPage() {
    const [barang, setBarang] = useState<Barang[]>([])
    const [transaksi, setTransaksi] = useState<Transaksi[]>([])
    const [loading, setLoading] = useState(true)
    const [showForm, setShowForm] = useState(false)
    const [editId, setEditId] = useState<string | null>(null)
    const [form, setForm] = useState({
        barangId: '',
        tipe: 'JUAL' as 'JUAL' | 'BELI',
        jumlah: 1,
        tanggal: new Date().toISOString().split('T')[0]
    })

    // Search barang state
    const [searchQuery, setSearchQuery] = useState('')
    const [showDropdown, setShowDropdown] = useState(false)
    const [selectedBarang, setSelectedBarang] = useState<Barang | null>(null)
    const dropdownRef = useRef<HTMLDivElement>(null)

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
        isAlert: false,
        autoClose: false,
        onConfirm: () => { }
    })

    useEffect(() => {
        loadData()
    }, [])

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setShowDropdown(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    const loadData = async () => {
        try {
            const [barangRes, transaksiRes] = await Promise.all([
                fetch('/api/barang'),
                fetch('/api/transaksi')
            ])
            if (!barangRes.ok || !transaksiRes.ok) {
                if (barangRes.status === 401 || transaksiRes.status === 401) {
                    return
                }
                console.error('Failed to fetch data')
                if (!barangRes.ok) console.error('Barang fetch error:', await barangRes.text())
                if (!transaksiRes.ok) console.error('Transaksi fetch error:', await transaksiRes.text())
                return
            }

            const barangData = await barangRes.json()
            const transaksiData = await transaksiRes.json()

            if (Array.isArray(barangData)) setBarang(barangData)
            else setBarang([])

            if (Array.isArray(transaksiData)) setTransaksi(transaksiData)
            else setTransaksi([])
        } catch (error) {
            console.error('Load data error:', error)
        } finally {
            setLoading(false)
        }
    }

    // Filter barang based on search query
    const filteredBarang = barang.filter(b =>
        b.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.kode.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.kategori?.nama.toLowerCase().includes(searchQuery.toLowerCase())
    )

    const handleSelectBarang = (b: Barang) => {
        setSelectedBarang(b)
        setForm({ ...form, barangId: b.id })
        setSearchQuery(`${b.kode} - ${b.nama}`)
        setShowDropdown(false)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        try {
            const url = editId ? `/api/transaksi/${editId}` : '/api/transaksi'
            const method = editId ? 'PUT' : 'POST'

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form)
            })

            if (!res.ok) {
                const data = await res.json()
                setConfirmModal({
                    isOpen: true,
                    title: 'Gagal',
                    description: data.error || 'Gagal menyimpan transaksi',
                    variant: 'error',
                    isAlert: true,
                    onConfirm: () => setConfirmModal(prev => ({ ...prev, isOpen: false }))
                })
                return
            }

            setConfirmModal({
                isOpen: true,
                title: 'Berhasil',
                description: editId ? 'Transaksi berhasil diupdate' : 'Transaksi berhasil disimpan',
                variant: 'success',
                isAlert: true,
                autoClose: true,
                onConfirm: () => setConfirmModal(prev => ({ ...prev, isOpen: false, autoClose: false }))
            })
            resetForm()
            loadData()
        } catch {
            setConfirmModal({
                isOpen: true,
                title: 'Kesalahan Koneksi',
                description: 'Terjadi kesalahan saat menghubungi server.',
                variant: 'error',
                isAlert: true,
                onConfirm: () => setConfirmModal(prev => ({ ...prev, isOpen: false }))
            })
        }
    }

    const handleEdit = (t: Transaksi) => {
        setForm({
            barangId: t.barangId,
            tipe: t.tipe,
            jumlah: t.jumlah,
            tanggal: new Date(t.tanggal).toISOString().split('T')[0]
        })
        setSelectedBarang(t.barang)
        setSearchQuery(`${t.barang.kode} - ${t.barang.nama}`)
        setEditId(t.id)
        setShowForm(true)
    }

    const handleDelete = (id: string) => {
        setConfirmModal({
            isOpen: true,
            title: 'Hapus Transaksi?',
            description: 'Tindakan ini tidak dapat dibatalkan. Stok barang akan dikembalikan ke kondisi sebelumnya.',
            variant: 'danger',
            isAlert: false,
            onConfirm: async () => {
                try {
                    const res = await fetch(`/api/transaksi/${id}`, { method: 'DELETE' })
                    if (!res.ok) {
                        const data = await res.json()
                        setConfirmModal({
                            isOpen: true,
                            title: 'Gagal',
                            description: data.error || 'Gagal menghapus transaksi',
                            variant: 'error',
                            isAlert: true,
                            onConfirm: () => setConfirmModal(prev => ({ ...prev, isOpen: false }))
                        })
                        return
                    }
                    setConfirmModal({
                        isOpen: true,
                        title: 'Berhasil',
                        description: 'Transaksi berhasil dihapus',
                        variant: 'success',
                        isAlert: true,
                        autoClose: true,
                        onConfirm: () => setConfirmModal(prev => ({ ...prev, isOpen: false, autoClose: false }))
                    })
                    loadData()
                } catch (error) {
                    console.error('Delete error:', error)
                    setConfirmModal({
                        isOpen: true,
                        title: 'Kesalahan Koneksi',
                        description: 'Terjadi kesalahan saat menghapus data.',
                        variant: 'error',
                        isAlert: true,
                        onConfirm: () => setConfirmModal(prev => ({ ...prev, isOpen: false }))
                    })
                }
            }
        })
    }

    const resetForm = () => {
        setShowForm(false)
        setEditId(null)
        setForm({
            barangId: '',
            tipe: 'JUAL',
            jumlah: 1,
            tanggal: new Date().toISOString().split('T')[0]
        })
        setSelectedBarang(null)
        setSearchQuery('')
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
                <h1 className="text-2xl font-bold text-white">Transaksi</h1>
                <button
                    onClick={() => setShowForm(true)}
                    className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg transition"
                >
                    + Tambah Transaksi
                </button>
            </div>

            {showForm && (
                <div className="relative z-20 p-6 bg-white/5 backdrop-blur rounded-2xl border border-white/10">
                    <h2 className="text-lg font-semibold text-white mb-4">
                        {editId ? 'Edit Transaksi' : 'Tambah Transaksi'}
                    </h2>
                    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-5 gap-4">
                        {/* Searchable Barang Dropdown */}
                        <div className="relative" ref={dropdownRef}>
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => {
                                    setSearchQuery(e.target.value)
                                    setShowDropdown(true)
                                    if (!e.target.value) {
                                        setSelectedBarang(null)
                                        setForm({ ...form, barangId: '' })
                                    }
                                }}
                                onFocus={() => setShowDropdown(true)}
                                placeholder="Cari barang..."
                                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                required={!form.barangId}
                            />

                            {showDropdown && (
                                <div className="absolute z-50 w-full mt-1 bg-slate-800 border border-white/10 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                                    {filteredBarang.length === 0 ? (
                                        <div className="px-4 py-3 text-slate-400 text-sm">
                                            Tidak ada barang ditemukan
                                        </div>
                                    ) : (
                                        filteredBarang.map((b) => (
                                            <button
                                                key={b.id}
                                                type="button"
                                                onClick={() => handleSelectBarang(b)}
                                                className={`w-full px-4 py-3 text-left hover:bg-white/10 transition flex justify-between items-center ${selectedBarang?.id === b.id ? 'bg-blue-600/20 border-l-2 border-blue-500' : ''
                                                    }`}
                                            >
                                                <div>
                                                    <span className="text-slate-400 font-mono text-sm">{b.kode}</span>
                                                    <span className="text-white ml-2">{b.nama}</span>
                                                    {b.kategori && (
                                                        <span className="ml-2 text-xs bg-slate-700 text-slate-300 px-1.5 py-0.5 rounded">
                                                            {b.kategori.nama}
                                                        </span>
                                                    )}
                                                </div>
                                                <span className="text-slate-400 text-sm">Stok: {b.stok}</span>
                                            </button>
                                        ))
                                    )}
                                </div>
                            )}
                            {/* Hidden input for form validation */}
                            <input type="hidden" value={form.barangId} required />
                        </div>

                        <select
                            value={form.tipe}
                            onChange={(e) => setForm({ ...form, tipe: e.target.value as 'JUAL' | 'BELI' })}
                            className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="JUAL" className="bg-slate-800">Penjualan</option>
                            <option value="BELI" className="bg-slate-800">Pembelian</option>
                        </select>
                        <input
                            type="number"
                            value={form.jumlah || ''}
                            onChange={(e) => setForm({ ...form, jumlah: parseInt(e.target.value) || 0 })}
                            placeholder="Jumlah"
                            className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            min="1"
                            required
                        />
                        <input
                            type="date"
                            value={form.tanggal}
                            onChange={(e) => setForm({ ...form, tanggal: e.target.value })}
                            className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                        />
                        <div className="flex space-x-2">
                            <button
                                type="submit"
                                className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg transition"
                            >
                                {editId ? 'Update' : 'Simpan'}
                            </button>
                            <button
                                type="button"
                                onClick={resetForm}
                                className="px-4 py-2 bg-slate-600 hover:bg-slate-500 text-white rounded-lg transition"
                            >
                                Batal
                            </button>
                        </div>
                    </form>
                </div>
            )}

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
                            <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Aksi</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan={8} className="px-6 py-8 text-center text-slate-400">
                                    Memuat data...
                                </td>
                            </tr>
                        ) : transaksi.length === 0 ? (
                            <tr>
                                <td colSpan={8} className="px-6 py-8 text-center text-slate-400">
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
                                    <td className="px-6 py-4">
                                        <button
                                            onClick={() => handleEdit(t)}
                                            className="px-3 py-1 text-sm text-blue-400 hover:bg-blue-500/10 rounded transition mr-2"
                                        >
                                            Edit
                                        </button>
                                        <button
                                            onClick={() => handleDelete(t.id)}
                                            className="px-3 py-1 text-sm text-red-400 hover:bg-red-500/10 rounded transition"
                                        >
                                            Hapus
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
            <ConfirmModal
                isOpen={confirmModal.isOpen}
                title={confirmModal.title}
                description={confirmModal.description}
                variant={confirmModal.variant}
                isAlert={confirmModal.isAlert}
                autoClose={confirmModal.autoClose}
                onConfirm={confirmModal.onConfirm}
                onCancel={() => setConfirmModal(prev => ({ ...prev, isOpen: false, autoClose: false }))}
                confirmText={confirmModal.isAlert ? "Tutup" : "Hapus"}
            />
        </div>
    )
}
