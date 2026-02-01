'use client'

import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import ConfirmModal from '@/components/ConfirmModal'

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

export default function BarangPage() {
    const [barang, setBarang] = useState<Barang[]>([])
    const [kategoriList, setKategoriList] = useState<Kategori[]>([])
    const [loading, setLoading] = useState(true)
    const [showForm, setShowForm] = useState(false)
    const [showKategoriForm, setShowKategoriForm] = useState(false) // Deprecated but keeping for now to avoid break if ref incorrect, though usage removed
    const [showKategoriSelect, setShowKategoriSelect] = useState(false)
    const [editId, setEditId] = useState<string | null>(null)
    const [form, setForm] = useState({ nama: '', stok: 0, satuan: 'Pcs', kategoriId: '' })
    const [kategoriForm, setKategoriForm] = useState({ nama: '' })
    const [searchQuery, setSearchQuery] = useState('')

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
        loadBarang()
        loadKategori()
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

    const loadKategori = async () => {
        try {
            const res = await fetch('/api/kategori')
            if (!res.ok) {
                console.error('Failed to fetch kategori:', await res.text())
                return
            }
            const data = await res.json()
            if (Array.isArray(data)) {
                setKategoriList(data)
            }
        } catch (error) {
            console.error('Load kategori error:', error)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        try {
            const url = editId ? `/api/barang/${editId}` : '/api/barang'
            const method = editId ? 'PUT' : 'POST'

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    nama: form.nama,
                    stok: form.stok,
                    satuan: form.satuan,
                    kategoriId: form.kategoriId || null
                })
            })

            if (!res.ok) {
                const data = await res.json()
                setConfirmModal({
                    isOpen: true,
                    title: 'Gagal',
                    description: data.error || 'Gagal menyimpan barang',
                    variant: 'error',
                    isAlert: true,
                    onConfirm: () => setConfirmModal(prev => ({ ...prev, isOpen: false }))
                })
                return
            }

            setConfirmModal({
                isOpen: true,
                title: 'Berhasil',
                description: editId ? 'Barang berhasil diupdate' : 'Barang berhasil ditambahkan',
                variant: 'success',
                isAlert: true,
                autoClose: true,
                onConfirm: () => setConfirmModal(prev => ({ ...prev, isOpen: false, autoClose: false }))
            })
            setShowForm(false)
            setEditId(null)
            setForm({ nama: '', stok: 0, satuan: 'Pcs', kategoriId: '' })
            loadBarang()
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

    const handleKategoriSubmit = async (e?: React.FormEvent) => {
        if (e) e.preventDefault()
        try {
            const res = await fetch('/api/kategori', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(kategoriForm)
            })

            if (!res.ok) {
                const data = await res.json()
                setConfirmModal({
                    isOpen: true,
                    title: 'Gagal',
                    description: data.error || 'Gagal menambah kategori',
                    variant: 'error',
                    isAlert: true,
                    onConfirm: () => setConfirmModal(prev => ({ ...prev, isOpen: false }))
                })
                return
            }

            setConfirmModal({
                isOpen: true,
                title: 'Berhasil',
                description: 'Kategori berhasil ditambahkan',
                variant: 'success',
                isAlert: true,
                autoClose: true,
                onConfirm: () => setConfirmModal(prev => ({ ...prev, isOpen: false, autoClose: false }))
            })
            setKategoriForm({ nama: '' })
            loadKategori()
        } catch {
            setConfirmModal({
                isOpen: true,
                title: 'Kesalahan Koneksi',
                description: 'Terjadi kesalahan saat hubungi server.',
                variant: 'error',
                isAlert: true,
                onConfirm: () => setConfirmModal(prev => ({ ...prev, isOpen: false }))
            })
        }
    }

    const handleEdit = (item: Barang) => {
        setForm({
            nama: item.nama,
            stok: item.stok,
            satuan: item.satuan,
            kategoriId: item.kategoriId || ''
        })
        setEditId(item.id)
        setShowForm(true)
    }

    const handleDelete = (id: string) => {
        setConfirmModal({
            isOpen: true,
            title: 'Hapus Barang?',
            description: 'Tindakan ini tidak dapat dibatalkan. Data barang akan dihapus permanen.',
            variant: 'danger',
            isAlert: false,
            onConfirm: async () => {
                try {
                    const res = await fetch(`/api/barang/${id}`, { method: 'DELETE' })
                    if (!res.ok) {
                        setConfirmModal({
                            isOpen: true,
                            title: 'Gagal',
                            description: 'Gagal menghapus barang',
                            variant: 'error',
                            isAlert: true,
                            onConfirm: () => setConfirmModal(prev => ({ ...prev, isOpen: false }))
                        })
                        return
                    }
                    setConfirmModal({
                        isOpen: true,
                        title: 'Berhasil',
                        description: 'Barang berhasil dihapus',
                        variant: 'success',
                        isAlert: true,
                        autoClose: true,
                        onConfirm: () => setConfirmModal(prev => ({ ...prev, isOpen: false, autoClose: false }))
                    })
                    loadBarang()
                } catch (error) {
                    console.error('Delete error:', error)
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
        })
    }

    const handleDeleteKategori = (id: string) => {
        setConfirmModal({
            isOpen: true,
            title: 'Hapus Kategori?',
            description: 'Barang dalam kategori ini akan menjadi tanpa kategori.',
            variant: 'danger',
            isAlert: false,
            onConfirm: async () => {
                try {
                    const res = await fetch(`/api/kategori/${id}`, { method: 'DELETE' })
                    if (!res.ok) {
                        setConfirmModal({
                            isOpen: true,
                            title: 'Gagal',
                            description: 'Gagal menghapus kategori',
                            variant: 'error',
                            isAlert: true,
                            onConfirm: () => setConfirmModal(prev => ({ ...prev, isOpen: false }))
                        })
                        return
                    }
                    setConfirmModal({
                        isOpen: true,
                        title: 'Berhasil',
                        description: 'Kategori berhasil dihapus',
                        variant: 'success',
                        isAlert: true,
                        autoClose: true,
                        onConfirm: () => setConfirmModal(prev => ({ ...prev, isOpen: false, autoClose: false }))
                    })
                    loadKategori()
                    loadBarang()
                } catch (error) {
                    console.error('Delete kategori error:', error)
                    setConfirmModal({
                        isOpen: true,
                        title: 'Kesalahan Koneksi',
                        description: 'Terjadi kesalahan saat menghapus kategori.',
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
        setForm({ nama: '', stok: 0, satuan: 'Pcs', kategoriId: '' })
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-white">Data Barang</h1>
                <div className="flex space-x-2">
                    <button
                        onClick={() => setShowForm(true)}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition"
                    >
                        + Tambah Barang
                    </button>
                </div>
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




            {/* Form Tambah/Edit Barang */}
            {showForm && (
                <div className="relative z-20 p-6 bg-white/5 backdrop-blur rounded-2xl border border-white/10">
                    <h2 className="text-lg font-semibold text-white mb-4">
                        {editId ? 'Edit Barang' : 'Tambah Barang'}
                    </h2>
                    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-5 gap-4">
                        <input
                            type="text"
                            value={form.nama}
                            onChange={(e) => setForm({ ...form, nama: e.target.value })}
                            placeholder="Nama Barang"
                            className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                        />
                        <input
                            type="number"
                            value={form.stok === 0 ? '' : form.stok}
                            onChange={(e) => {
                                const val = e.target.value
                                setForm({ ...form, stok: val === '' ? 0 : parseInt(val) })
                            }}
                            placeholder="Stok"
                            className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            min="0"
                        />
                        <select
                            value={form.satuan}
                            onChange={(e) => setForm({ ...form, satuan: e.target.value })}
                            className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            {['Pcs', 'Kg', 'Gram', 'Liter', 'Mililiter', 'Karung', 'Kardus', 'Box', 'Lusin', 'Meter', 'Roll', 'Unit', 'Pasang', 'Set'].map(s => (
                                <option key={s} value={s} className="bg-slate-800">{s}</option>
                            ))}
                        </select>
                        <div className="relative">
                            <button
                                type="button"
                                onClick={() => setShowKategoriSelect(!showKategoriSelect)}
                                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-left focus:outline-none focus:ring-2 focus:ring-blue-500 flex justify-between items-center"
                            >
                                <span className={!form.kategoriId ? 'text-slate-400' : ''}>
                                    {form.kategoriId
                                        ? kategoriList.find(k => k.id === form.kategoriId)?.nama || 'Tanpa Kategori'
                                        : 'Pilih Kategori'}
                                </span>
                                <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            </button>

                            {showKategoriSelect && (
                                <div className="absolute top-full left-0 w-full mt-1 bg-slate-800 border border-white/10 rounded-lg shadow-xl z-50">
                                    <div className="p-2 border-b border-white/10">
                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                value={kategoriForm.nama}
                                                onChange={(e) => setKategoriForm({ nama: e.target.value })}
                                                placeholder="Tambah baru..."
                                                className="flex-1 px-2 py-1 bg-white/5 border border-white/10 rounded text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-purple-500"
                                                onClick={(e) => e.stopPropagation()}
                                            />
                                            <button
                                                type="button"
                                                onClick={(e) => { e.stopPropagation(); handleKategoriSubmit(); }}
                                                className="px-2 py-1 bg-purple-600 hover:bg-purple-500 text-white text-xs rounded transition"
                                            >
                                                +
                                            </button>
                                        </div>
                                    </div>
                                    <div className="max-h-48 overflow-y-auto">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setForm({ ...form, kategoriId: '' })
                                                setShowKategoriSelect(false)
                                            }}
                                            className="w-full text-left px-4 py-2 text-sm text-slate-400 hover:bg-white/5 border-b border-white/5"
                                        >
                                            Tanpa Kategori
                                        </button>
                                        {kategoriList.map((k) => (
                                            <div key={k.id} className="flex items-center justify-between px-2 hover:bg-white/5 group/item">
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setForm({ ...form, kategoriId: k.id })
                                                        setShowKategoriSelect(false)
                                                    }}
                                                    className={`flex-1 text-left px-2 py-2 text-sm ${form.kategoriId === k.id ? 'text-blue-400' : 'text-white'}`}
                                                >
                                                    {k.nama}
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        handleDeleteKategori(k.id)
                                                    }}
                                                    className="p-1 text-slate-500 hover:text-red-400 opacity-0 group-hover/item:opacity-100 transition"
                                                >
                                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                    </svg>
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                        <div className="flex space-x-2 md:col-span-2">
                            <button
                                type="submit"
                                className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg transition"
                            >
                                Simpan
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
                            <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Aksi</th>
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
                                    <td className="px-6 py-4">
                                        <button
                                            onClick={() => handleEdit(item)}
                                            className="px-3 py-1 text-sm text-blue-400 hover:bg-blue-500/10 rounded transition mr-2"
                                        >
                                            Edit
                                        </button>
                                        <button
                                            onClick={() => handleDelete(item.id)}
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
