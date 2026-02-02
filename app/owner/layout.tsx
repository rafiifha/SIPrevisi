'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'
import ConfirmModal from '@/components/ConfirmModal'

interface User {
    id: string
    username: string
    role: 'KARYAWAN' | 'OWNER'
}

export default function OwnerLayout({ children }: { children: React.ReactNode }) {
    const router = useRouter()
    const pathname = usePathname()
    const [user, setUser] = useState<User | null>(null)
    const [loading, setLoading] = useState(true)
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
        checkAuth()
    }, [])

    const checkAuth = async () => {
        try {
            const res = await fetch('/api/auth/me')
            if (!res.ok) {
                router.push('/login')
                return
            }
            const data = await res.json()
            if (data.user.role !== 'OWNER') {
                router.push('/karyawan')
                return
            }
            setUser(data.user)
            setLoading(false)
        } catch {
            router.push('/login')
        } finally {
            // Only stop loading if we successfully got the user
            // If redirecting, keep loading to prevent content flash
        }
    }

    const handleLogout = async () => {
        await fetch('/api/auth/logout', { method: 'POST' })
        setConfirmModal({
            isOpen: true,
            title: 'Berhasil Keluar',
            description: 'Anda telah keluar dari aplikasi.',
            variant: 'success',
            isAlert: true,
            autoClose: true,
            onConfirm: () => {
                setConfirmModal(prev => ({ ...prev, isOpen: false, autoClose: false }))
                router.push('/login')
            }
        })
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-900">
                <div className="text-white">Memuat...</div>
            </div>
        )
    }

    const navItems = [
        { href: '/owner', label: 'Perencanaan Stok' },
        { href: '/owner/barang', label: 'Data Barang' },
        { href: '/owner/transaksi', label: 'Data Transaksi' },
    ]

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
            <nav className="bg-white/5 backdrop-blur-lg border-b border-white/10">
                <div className="max-w-7xl mx-auto px-4">
                    <div className="flex items-center justify-between h-16">
                        <div className="flex items-center space-x-8">
                            <span className="text-xl font-bold text-white">Toko Berkah</span>
                            <div className="hidden md:flex items-center space-x-4">
                                {navItems.map((item) => (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        className={`px-3 py-2 rounded-md text-sm font-medium transition ${pathname === item.href
                                            ? 'bg-purple-600 text-white'
                                            : 'text-slate-300 hover:bg-white/10 hover:text-white'
                                            }`}
                                    >
                                        {item.label}
                                    </Link>
                                ))}
                            </div>
                        </div>
                        <div className="flex items-center space-x-4">
                            <span className="text-slate-300 text-sm">
                                {user?.username} <span className="text-purple-400">(Owner)</span>
                            </span>
                            <button
                                onClick={() => setConfirmModal({
                                    isOpen: true,
                                    title: 'Konfirmasi Keluar',
                                    description: 'Apakah Anda yakin ingin keluar dari aplikasi?',
                                    variant: 'info',
                                    isAlert: false,
                                    onConfirm: handleLogout
                                })}
                                className="px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 rounded-lg transition"
                            >
                                Keluar
                            </button>
                        </div>
                    </div>
                </div>
            </nav>
            <main className="max-w-7xl mx-auto px-4 py-8">
                {children}
            </main>

            <ConfirmModal
                isOpen={confirmModal.isOpen}
                title={confirmModal.title}
                description={confirmModal.description}
                variant={confirmModal.variant}
                isAlert={confirmModal.isAlert}
                autoClose={confirmModal.autoClose}
                onConfirm={confirmModal.onConfirm}
                onCancel={() => setConfirmModal(prev => ({ ...prev, isOpen: false, autoClose: false }))}
                confirmText={confirmModal.isAlert ? "Tutup" : "Keluar"}
            />
        </div>
    )
}
