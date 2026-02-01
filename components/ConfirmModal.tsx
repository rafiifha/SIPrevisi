'use client'

import { useEffect } from 'react'

interface ConfirmModalProps {
    isOpen: boolean
    title: string
    description?: string
    confirmText?: string
    cancelText?: string
    variant?: 'danger' | 'info' | 'success' | 'error'
    isAlert?: boolean // If true, only shows the confirm button (OK style)
    autoClose?: boolean // If true, closes automatically after duration
    autoCloseDuration?: number // Duration in ms
    onConfirm: () => void
    onCancel?: () => void
}

export default function ConfirmModal({
    isOpen,
    title,
    description,
    confirmText,
    cancelText = 'Batal',
    variant = 'danger',
    isAlert = false,
    autoClose = false,
    autoCloseDuration = 2000,
    onConfirm,
    onCancel
}: ConfirmModalProps) {
    useEffect(() => {
        if (isOpen && autoClose) {
            const timer = setTimeout(() => {
                onConfirm()
            }, autoCloseDuration)
            return () => clearTimeout(timer)
        }
    }, [isOpen, autoClose, autoCloseDuration, onConfirm])

    if (!isOpen) return null

    const typeConfig = {
        danger: {
            bg: 'bg-red-500/10',
            text: 'text-red-500',
            button: 'bg-red-600 hover:bg-red-500 shadow-red-600/20',
            icon: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
            )
        },
        info: {
            bg: 'bg-blue-500/10',
            text: 'text-blue-500',
            button: 'bg-blue-600 hover:bg-blue-500 shadow-blue-600/20',
            icon: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            )
        },
        success: {
            bg: 'bg-green-500/10',
            text: 'text-green-500',
            button: 'bg-green-600 hover:bg-green-500 shadow-green-600/20',
            icon: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
            )
        },
        error: {
            bg: 'bg-red-500/10',
            text: 'text-red-500',
            button: 'bg-red-600 hover:bg-red-500 shadow-red-600/20',
            icon: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
            )
        }
    }

    const config = typeConfig[variant]
    const finalConfirmText = confirmText || (isAlert ? 'Tutup' : 'Hapus')

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div
                className="w-full max-w-sm bg-slate-900 border border-white/10 rounded-2xl p-6 shadow-2xl shadow-slate-950/50 animate-in zoom-in-95 duration-200"
                onClick={(e) => e.stopPropagation()}
            >
                <div className={`flex items-center justify-center w-12 h-12 rounded-full mb-4 mx-auto ${config.bg} ${config.text}`}>
                    {config.icon}
                </div>

                <div className="text-center">
                    <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
                    {description && (
                        <p className="text-slate-400 text-sm mb-6 leading-relaxed">
                            {description}
                        </p>
                    )}
                </div>

                <div className="flex flex-col-reverse sm:flex-row sm:space-x-2 gap-2">
                    {!isAlert && (
                        <button
                            onClick={onCancel}
                            className="flex-1 px-4 py-2 text-sm font-semibold text-slate-300 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition"
                        >
                            {cancelText}
                        </button>
                    )}
                    <button
                        onClick={onConfirm}
                        className={`flex-1 px-4 py-2 text-sm font-semibold text-white rounded-xl transition shadow-lg ${config.button}`}
                    >
                        {finalConfirmText}
                    </button>
                </div>
            </div>
        </div>
    )
}

