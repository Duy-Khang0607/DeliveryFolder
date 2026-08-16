'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { ArrowLeft, ArrowRight, Loader2, Package, User, X } from 'lucide-react'
import Image from 'next/image'
import { ReactNode } from 'react'
import { formatVndCompact } from '@/app/lib/currency'

export type HistoryStatPill = {
    icon: ReactNode
    label: string
    value: string | number
    color: string
}

type DeliveryHistoryModalProps = {
    open: boolean
    onClose: () => void
    name: string
    subtitle?: string
    image?: string | null
    stats: HistoryStatPill[]
    orders: any[]
    loading?: boolean
    historyPage?: number
    totalPages?: number
    onPageChange?: (page: number) => void
    emptyMessage?: string
    amountKey?: 'shipperEarning' | 'totalAmount'
}

const DeliveryHistoryModal = ({
    open,
    onClose,
    name,
    subtitle = 'Delivery History',
    image,
    stats,
    orders,
    loading = false,
    historyPage = 1,
    totalPages = 1,
    onPageChange,
    emptyMessage = 'No delivered orders yet',
    amountKey = 'shipperEarning',
}: DeliveryHistoryModalProps) => {
    return (
        <AnimatePresence>
            {open && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center px-4"
                    onClick={onClose}
                >
                    <motion.div
                        initial={{ scale: 0.93, opacity: 0, y: 16 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.93, opacity: 0, y: 16 }}
                        transition={{ duration: 0.25, ease: 'easeOut' }}
                        onClick={(e) => e.stopPropagation()}
                        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[65vh] flex flex-col overflow-hidden"
                    >
                        <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100 shrink-0">
                            <div className="w-9 h-9 rounded-xl overflow-hidden bg-gray-100 flex items-center justify-center shrink-0">
                                {image
                                    ? <Image src={image} alt={name} width={36} height={36} className="object-cover w-full h-full" />
                                    : <User className="w-4 h-4 text-gray-400" />}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="font-bold text-gray-800 text-sm truncate">{name}</p>
                                <p className="text-xs text-gray-400">{subtitle}</p>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 transition-all cursor-pointer"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <div className={`px-5 py-3 grid gap-3 border-b border-gray-100 shrink-0 grid-cols-${Math.min(stats.length, 3)}`}
                            style={{ gridTemplateColumns: `repeat(${stats.length}, minmax(0, 1fr))` }}
                        >
                            {stats.map((s) => (
                                <div key={s.label} className={`flex flex-col items-center py-2.5 rounded-xl ${s.color}`}>
                                    <span className="mb-0.5">{s.icon}</span>
                                    <p className="text-xs text-gray-500">{s.label}</p>
                                    <p className="font-extrabold text-sm">{s.value}</p>
                                </div>
                            ))}
                        </div>

                        <div className="flex-1 overflow-y-auto custom-scrollbar px-5 py-3">
                            {loading ? (
                                <div className="flex items-center justify-center py-10">
                                    <Loader2 className="w-6 h-6 animate-spin text-green-600" />
                                </div>
                            ) : orders.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-10 gap-2">
                                    <Package className="w-8 h-8 text-gray-300" />
                                    <p className="text-sm text-gray-400">{emptyMessage}</p>
                                </div>
                            ) : (
                                <div className="flex flex-col gap-3">
                                    {orders.map((order: any) => (
                                        <div key={order._id} className="flex flex-col gap-1.5 p-3 bg-gray-50 rounded-xl border border-gray-100">
                                            <div className="flex items-center justify-between gap-2">
                                                <span className="text-xs font-bold text-gray-800 font-mono">
                                                    #{order._id?.toString()?.slice(-6)}
                                                </span>
                                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-green-50 text-green-600 border border-green-200">
                                                    Delivered
                                                </span>
                                            </div>
                                            <div className="flex items-center justify-between text-xs text-gray-500 gap-2">
                                                <span className="flex items-center gap-1 min-w-0 truncate">
                                                    <User className="w-3 h-3 shrink-0" />
                                                    <span className="truncate">
                                                        {(order.user as any)?.name || order.address?.fullName || '—'}
                                                    </span>
                                                </span>
                                                <span className="font-bold text-green-700 shrink-0">
                                                    {formatVndCompact(order[amountKey] ?? order.totalAmount ?? 0)}
                                                </span>
                                            </div>
                                            <div className="flex items-center justify-between text-[11px] text-gray-400">
                                                <span>
                                                    {order.deliveryDistanceKm
                                                        ? `${order.deliveryDistanceKm} km`
                                                        : `${order.items?.length ?? 0} item${order.items?.length !== 1 ? 's' : ''}`}
                                                </span>
                                                <span>
                                                    {order.deliveredAt
                                                        ? new Date(order.deliveredAt).toLocaleString('vi-VN', {
                                                            hour: '2-digit',
                                                            minute: '2-digit',
                                                            day: '2-digit',
                                                            month: '2-digit',
                                                        })
                                                        : '—'}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {totalPages > 1 && onPageChange && (
                            <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-between shrink-0">
                                <button
                                    onClick={() => onPageChange(Math.max(1, historyPage - 1))}
                                    disabled={historyPage <= 1}
                                    className="flex items-center gap-1 text-xs font-semibold text-gray-500 hover:text-gray-800 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
                                >
                                    <ArrowLeft className="w-3.5 h-3.5" /> Prev
                                </button>
                                <span className="text-xs text-gray-400">
                                    Page <span className="font-bold text-gray-700">{historyPage}</span> / {totalPages}
                                </span>
                                <button
                                    onClick={() => onPageChange(Math.min(totalPages, historyPage + 1))}
                                    disabled={historyPage >= totalPages}
                                    className="flex items-center gap-1 text-xs font-semibold text-gray-500 hover:text-gray-800 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
                                >
                                    Next <ArrowRight className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        )}
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    )
}

export default DeliveryHistoryModal
