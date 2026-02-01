'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import ConfirmModal from '@/components/ConfirmModal'

export default function LoginPage() {
    const router = useRouter()
    const [username, setUsername] = useState('')
    const [password, setPassword] = useState('')
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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            })

            const data = await res.json()

            if (!res.ok) {
                setConfirmModal({
                    isOpen: true,
                    title: 'Login Gagal',
                    description: data.error || 'Username atau password salah.',
                    variant: 'error',
                    isAlert: true,
                    onConfirm: () => setConfirmModal(prev => ({ ...prev, isOpen: false }))
                })
                return
            }

            setConfirmModal({
                isOpen: true,
                title: 'Login Berhasil',
                description: `Selamat datang kembali, ${data.user.username}!`,
                variant: 'success',
                isAlert: true,
                autoClose: true,
                onConfirm: () => {
                    setConfirmModal(prev => ({ ...prev, isOpen: false, autoClose: false }))
                    if (data.user.role === 'OWNER') {
                        router.push('/owner')
                    } else {
                        router.push('/karyawan')
                    }
                }
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

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
            <div className="w-full max-w-md p-8 bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl border border-white/20">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-white mb-2">Hallo!</h1>
                    <p className="text-slate-300">Selamat Datang</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">

                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                            Username
                        </label>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                            placeholder="Masukkan username"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                            Password
                        </label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                            placeholder="Masukkan password"
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-semibold rounded-xl transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Memproses...' : 'Masuk'}
                    </button>
                </form>
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
                confirmText="OK"
            />
        </div>
    )
}
