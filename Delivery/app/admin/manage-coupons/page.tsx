'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { useState } from 'react'
import axios from 'axios'
import {
    ArrowLeft, Calendar, CheckCircle, Edit, Infinity, Loader2,
    Percent, Plus, Tag, ToggleLeft, ToggleRight, Trash2, X, XCircle
} from 'lucide-react'
import { useToast } from '@/app/components/Toast'
import { useRouter } from 'next/navigation'
import { ICoupon } from '@/app/models/coupon.model'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { formatVnd } from '@/app/lib/currency'

// ─── Types ───────────────────────────────────────────────────
interface CouponForm {
    code: string
    discountType: 'percentage' | 'fixed'
    discountValue: string
    minOrderAmount: string
    maxUses: string
    expiresAt: string
    isActive: boolean
}

const emptyForm: CouponForm = {
    code: '',
    discountType: 'percentage',
    discountValue: '',
    minOrderAmount: '',
    maxUses: '',
    expiresAt: '',
    isActive: true,
}

// ─── CouponFormModal ──────────────────────────────────────────
const CouponFormModal = ({
    editItem,
    onClose,
    onSave,
    saving,
}: {
    editItem: ICoupon | null
    onClose: () => void
    onSave: (form: CouponForm) => void
    saving: boolean
}) => {
    const [form, setForm] = useState<CouponForm>(
        editItem
            ? {
                code: editItem.code,
                discountType: editItem.discountType,
                discountValue: String(editItem.discountValue),
                minOrderAmount: String(editItem.minOrderAmount),
                maxUses: editItem.maxUses != null ? String(editItem.maxUses) : '',
                expiresAt: editItem.expiresAt
                    ? new Date(editItem.expiresAt).toISOString().slice(0, 16)
                    : '',
                isActive: editItem.isActive,
            }
            : emptyForm
    )

    const set = (key: keyof CouponForm, val: any) =>
        setForm(prev => ({ ...prev, [key]: val }))

    const inputClass =
        'w-full px-3 py-2.5 text-sm rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-green-500 transition-all'
    const labelClass = 'text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block'

    return (
        <motion.div
            className='fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center px-4'
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.93, opacity: 0, y: 16 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.93, opacity: 0, y: 16 }}
                transition={{ duration: 0.25, ease: 'easeOut' }}
                onClick={e => e.stopPropagation()}
                className='bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto custom-scrollbar'
            >
                {/* Header */}
                <div className='flex items-center justify-between p-5 border-b border-gray-100'>
                    <div className='flex items-center gap-2'>
                        <div className='w-8 h-8 rounded-xl bg-green-50 flex items-center justify-center'>
                            <Tag className='w-4 h-4 text-green-600' />
                        </div>
                        <h2 className='font-extrabold text-gray-800 text-base'>
                            {editItem ? 'Edit Coupon' : 'Create Coupon'}
                        </h2>
                    </div>
                    <button onClick={onClose} className='p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 transition-all cursor-pointer'>
                        <X className='w-4 h-4' />
                    </button>
                </div>

                {/* Form */}
                <div className='p-5 flex flex-col gap-4'>
                    {/* Code */}
                    <div>
                        <label className={labelClass}>Coupon Code *</label>
                        <input
                            className={inputClass + ' uppercase font-mono tracking-widest'}
                            placeholder='e.g. SAVE20'
                            value={form.code}
                            onChange={e => set('code', e.target.value.toUpperCase())}
                            disabled={!!editItem}
                        />
                        {editItem && <p className='text-[11px] text-gray-400 mt-1'>Code cannot be changed after creation.</p>}
                    </div>

                    {/* Discount type + value */}
                    <div className='grid grid-cols-2 gap-3'>
                        <div>
                            <label className={labelClass}>Discount Type *</label>
                            <select
                                className={inputClass}
                                value={form.discountType}
                                onChange={e => set('discountType', e.target.value)}
                            >
                                <option value='percentage'>Percentage (%)</option>
                                <option value='fixed'>Fixed (VND)</option>
                            </select>
                        </div>
                        <div>
                            <label className={labelClass}>
                                Value * {form.discountType === 'percentage' ? '(%)' : '(VND)'}
                            </label>
                            <input
                                type='number'
                                min={0}
                                max={form.discountType === 'percentage' ? 100 : undefined}
                                className={inputClass}
                                placeholder={form.discountType === 'percentage' ? '10' : '50000'}
                                value={form.discountValue}
                                onChange={e => set('discountValue', e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Min order + max uses */}
                    <div className='grid grid-cols-2 gap-3'>
                        <div>
                            <label className={labelClass}>Min Order (VND)</label>
                            <input
                                type='number'
                                min={0}
                                className={inputClass}
                                placeholder='0'
                                value={form.minOrderAmount}
                                onChange={e => set('minOrderAmount', e.target.value)}
                            />
                        </div>
                        <div>
                            <label className={labelClass}>Max Uses (blank = ∞)</label>
                            <input
                                type='number'
                                min={1}
                                className={inputClass}
                                placeholder='Unlimited'
                                value={form.maxUses}
                                onChange={e => set('maxUses', e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Expires at */}
                    <div>
                        <label className={labelClass}>Expires At (optional)</label>
                        <input
                            type='datetime-local'
                            className={inputClass}
                            value={form.expiresAt}
                            onChange={e => set('expiresAt', e.target.value)}
                        />
                    </div>

                    {/* Active toggle */}
                    <div className='flex items-center justify-between py-2 px-3 bg-gray-50 rounded-xl border border-gray-100'>
                        <span className='text-sm font-semibold text-gray-700'>Active</span>
                        <button
                            type='button'
                            onClick={() => set('isActive', !form.isActive)}
                            className='cursor-pointer'
                        >
                            {form.isActive
                                ? <ToggleRight className='w-7 h-7 text-green-500' />
                                : <ToggleLeft className='w-7 h-7 text-gray-400' />}
                        </button>
                    </div>

                    {/* Actions */}
                    <div className='flex gap-2 pt-1'>
                        <button
                            onClick={onClose}
                            className='flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 cursor-pointer hover:bg-gray-50 transition-all'
                        >
                            Cancel
                        </button>
                        <motion.button
                            whileTap={{ scale: 0.97 }}
                            onClick={() => onSave(form)}
                            disabled={saving || !form.code.trim() || !form.discountValue}
                            className='flex-1 py-2.5 rounded-xl bg-green-600 hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white text-sm font-bold cursor-pointer transition-all flex items-center justify-center gap-2'
                        >
                            {saving ? <Loader2 className='w-4 h-4 animate-spin' /> : (editItem ? 'Save Changes' : 'Create Coupon')}
                        </motion.button>
                    </div>
                </div>
            </motion.div>
        </motion.div>
    )
}

// ─── Main Page ────────────────────────────────────────────────
const ManageCoupons = () => {
    const router = useRouter()
    const { showToast } = useToast()
    const queryClient = useQueryClient()

    const [showForm, setShowForm] = useState(false)
    const [editItem, setEditItem] = useState<ICoupon | null>(null)
    const [deleteId, setDeleteId] = useState<string | null>(null)

    // ── Fetch ──────────────────────────────────────────────────
    const { data, isLoading } = useQuery({
        queryKey: ['admin-coupons'],
        queryFn: () => axios.get('/api/auth/admin/coupons').then(r => r.data.coupons as ICoupon[]),
    })
    const coupons = data ?? []

    // ── Mutations ──────────────────────────────────────────────
    const createMutation = useMutation({
        mutationFn: (body: any) => axios.post('/api/auth/admin/coupons', body),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-coupons'] })
            setShowForm(false)
            showToast('Coupon created!', 'success')
        },
        onError: (err: any) => showToast(err?.response?.data?.message || 'Failed to create', 'error'),
    })

    const updateMutation = useMutation({
        mutationFn: ({ id, body }: { id: string; body: any }) =>
            axios.put(`/api/auth/admin/coupons/${id}`, body),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-coupons'] })
            setEditItem(null)
            setShowForm(false)
            showToast('Coupon updated!', 'success')
        },
        onError: (err: any) => showToast(err?.response?.data?.message || 'Failed to update', 'error'),
    })

    const deleteMutation = useMutation({
        mutationFn: (id: string) => axios.delete(`/api/auth/admin/coupons/${id}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-coupons'] })
            setDeleteId(null)
            showToast('Coupon deleted!', 'success')
        },
        onError: () => showToast('Failed to delete', 'error'),
    })

    const toggleActive = (coupon: ICoupon) => {
        updateMutation.mutate({
            id: coupon._id.toString(),
            body: { isActive: !coupon.isActive },
        })
    }

    const handleSave = (form: CouponForm) => {
        const body = {
            code: form.code.trim().toUpperCase(),
            discountType: form.discountType,
            discountValue: Number(form.discountValue),
            minOrderAmount: form.minOrderAmount ? Number(form.minOrderAmount) : 0,
            maxUses: form.maxUses ? Number(form.maxUses) : null,
            expiresAt: form.expiresAt || null,
            isActive: form.isActive,
        }
        if (editItem) {
            updateMutation.mutate({ id: editItem._id.toString(), body })
        } else {
            createMutation.mutate(body)
        }
    }

    const saving = createMutation.isPending || updateMutation.isPending

    const isExpired = (coupon: ICoupon) =>
        coupon.expiresAt && new Date(coupon.expiresAt) < new Date()

    const stats = {
        total: coupons.length,
        active: coupons.filter(c => c.isActive && !isExpired(c)).length,
        expired: coupons.filter(c => isExpired(c)).length,
    }

    return (
        <div className='min-h-screen bg-gray-50'>
            {/* Fixed Header */}
            <div className='fixed top-0 left-0 w-full bg-white/80 backdrop-blur-xl border-b border-gray-100 shadow-sm z-40'>
                <div className='max-w-4xl mx-auto px-4 py-3 flex items-center gap-3'>
                    <button
                        onClick={() => router.push('/')}
                        className='p-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-600 transition-all cursor-pointer'
                    >
                        <ArrowLeft className='w-4 h-4' />
                    </button>
                    <div className='flex-1'>
                        <h1 className='font-extrabold text-lg text-gray-800 leading-tight'>Manage Coupons</h1>
                        <p className='text-xs text-gray-400'>{coupons.length} total coupons</p>
                    </div>
                    <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={() => { setEditItem(null); setShowForm(true) }}
                        className='flex items-center gap-1.5 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm'
                    >
                        <Plus className='w-3.5 h-3.5' />
                        New Coupon
                    </motion.button>
                </div>
            </div>

            <div className='max-w-4xl mx-auto px-4 pt-24 pb-16'>

                {/* Stats */}
                <div className='grid grid-cols-3 gap-3 mb-6'>
                    {[
                        { label: 'Total', value: stats.total, color: 'bg-white border-gray-100 text-gray-800' },
                        { label: 'Active', value: stats.active, color: 'bg-green-50 border-green-100 text-green-700' },
                        { label: 'Expired', value: stats.expired, color: 'bg-red-50 border-red-100 text-red-600' },
                    ].map(s => (
                        <motion.div
                            key={s.label}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={`rounded-2xl border p-4 text-center shadow-sm ${s.color}`}
                        >
                            <p className='text-xs text-gray-400 mb-0.5'>{s.label}</p>
                            <p className='text-2xl font-extrabold'>{s.value}</p>
                        </motion.div>
                    ))}
                </div>

                {/* Loading */}
                {isLoading ? (
                    <div className='flex items-center justify-center py-20'>
                        <Loader2 className='w-8 h-8 animate-spin text-green-600' />
                    </div>
                ) : coupons.length === 0 ? (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className='flex flex-col items-center justify-center py-20 gap-3 bg-white rounded-2xl border border-dashed border-gray-200'
                    >
                        <div className='w-14 h-14 rounded-2xl bg-green-50 flex items-center justify-center'>
                            <Tag className='w-7 h-7 text-green-500' />
                        </div>
                        <p className='font-bold text-gray-700'>No coupons yet</p>
                        <p className='text-sm text-gray-400'>Create your first coupon to start offering discounts.</p>
                        <motion.button
                            whileTap={{ scale: 0.95 }}
                            onClick={() => { setEditItem(null); setShowForm(true) }}
                            className='mt-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded-xl transition-all cursor-pointer'
                        >
                            Create Coupon
                        </motion.button>
                    </motion.div>
                ) : (
                    /* Coupon list */
                    <div className='flex flex-col gap-3'>
                        {coupons.map((coupon, index) => {
                            const expired = isExpired(coupon)
                            const usagePercent = coupon.maxUses
                                ? Math.min((coupon.usedCount / coupon.maxUses) * 100, 100)
                                : 0

                            return (
                                <motion.div
                                    key={coupon._id.toString()}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.25, delay: index * 0.04 }}
                                    className={`bg-white rounded-2xl border shadow-sm transition-all duration-200 overflow-hidden
                                        ${expired ? 'opacity-60 border-gray-100' : coupon.isActive ? 'border-gray-100 hover:shadow-md' : 'border-gray-100 opacity-70'}`}
                                >
                                    {/* Status bar */}
                                    <div className={`h-1 w-full ${expired ? 'bg-red-300' : coupon.isActive ? 'bg-linear-to-r from-green-400 to-emerald-500' : 'bg-gray-200'}`} />

                                    <div className='p-4 sm:p-5'>
                                        {/* Row 1: code + badges + actions */}
                                        <div className='flex items-start justify-between gap-3 mb-3'>
                                            <div className='flex items-center gap-3 flex-wrap'>
                                                {/* Code pill */}
                                                <span className='px-3 py-1 bg-gray-900 text-white text-sm font-black rounded-lg font-mono tracking-widest'>
                                                    {coupon.code}
                                                </span>

                                                {/* Discount badge */}
                                                <span className={`flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border
                                                    ${coupon.discountType === 'percentage'
                                                        ? 'bg-blue-50 text-blue-700 border-blue-200'
                                                        : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
                                                    {coupon.discountType === 'percentage'
                                                        ? <><Percent className='w-3 h-3' /> {coupon.discountValue}% off</>
                                                        : <>{formatVnd(Number(coupon.discountValue))} off</>}
                                                </span>

                                                {/* Status badge */}
                                                {expired ? (
                                                    <span className='flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-50 text-red-500 border border-red-200'>
                                                        <XCircle className='w-3 h-3' /> Expired
                                                    </span>
                                                ) : coupon.isActive ? (
                                                    <span className='flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-50 text-green-600 border border-green-200'>
                                                        <CheckCircle className='w-3 h-3' /> Active
                                                    </span>
                                                ) : (
                                                    <span className='flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-100 text-gray-500 border border-gray-200'>
                                                        Inactive
                                                    </span>
                                                )}
                                            </div>

                                            {/* Action buttons */}
                                            <div className='flex items-center gap-1.5 shrink-0'>
                                                <button
                                                    onClick={() => toggleActive(coupon)}
                                                    className='p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 transition-all cursor-pointer'
                                                    title={coupon.isActive ? 'Deactivate' : 'Activate'}
                                                >
                                                    {coupon.isActive
                                                        ? <ToggleRight className='w-4 h-4 text-green-500' />
                                                        : <ToggleLeft className='w-4 h-4' />}
                                                </button>
                                                <button
                                                    onClick={() => { setEditItem(coupon); setShowForm(true) }}
                                                    className='p-1.5 rounded-lg bg-green-50 hover:bg-green-100 text-green-600 transition-all cursor-pointer'
                                                >
                                                    <Edit className='w-3.5 h-3.5' />
                                                </button>
                                                <button
                                                    onClick={() => setDeleteId(coupon._id.toString())}
                                                    className='p-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-500 transition-all cursor-pointer'
                                                >
                                                    <Trash2 className='w-3.5 h-3.5' />
                                                </button>
                                            </div>
                                        </div>

                                        {/* Row 2: metadata */}
                                        <div className='flex flex-wrap items-center gap-3 text-xs text-gray-500'>
                                            {coupon.minOrderAmount > 0 && (
                                                <span>Min order: <strong className='text-gray-700'>{formatVnd(coupon.minOrderAmount)}</strong></span>
                                            )}
                                            {coupon.expiresAt && (
                                                <span className='flex items-center gap-1'>
                                                    <Calendar className='w-3 h-3' />
                                                    Expires: <strong className={`ml-0.5 ${expired ? 'text-red-500' : 'text-gray-700'}`}>
                                                        {new Date(coupon.expiresAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                                    </strong>
                                                </span>
                                            )}
                                        </div>

                                        {/* Row 3: usage bar */}
                                        <div className='mt-3'>
                                            <div className='flex items-center justify-between mb-1'>
                                                <span className='text-xs text-gray-400'>Usage</span>
                                                <span className='text-xs font-semibold text-gray-600'>
                                                    {coupon.usedCount} / {coupon.maxUses != null
                                                        ? coupon.maxUses
                                                        : <span className='inline-flex items-center gap-0.5'><Infinity className='w-3 h-3' /></span>}
                                                </span>
                                            </div>
                                            <div className='h-1.5 w-full bg-gray-100 rounded-full overflow-hidden'>
                                                {coupon.maxUses != null && (
                                                    <motion.div
                                                        className={`h-full rounded-full ${usagePercent >= 100 ? 'bg-red-400' : usagePercent > 70 ? 'bg-amber-400' : 'bg-green-500'}`}
                                                        initial={{ width: 0 }}
                                                        animate={{ width: `${usagePercent}%` }}
                                                        transition={{ duration: 0.5, ease: 'easeOut' }}
                                                    />
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            )
                        })}
                    </div>
                )}
            </div>

            {/* Form Modal */}
            <AnimatePresence>
                {showForm && (
                    <CouponFormModal
                        editItem={editItem}
                        onClose={() => { setShowForm(false); setEditItem(null) }}
                        onSave={handleSave}
                        saving={saving}
                    />
                )}
            </AnimatePresence>

            {/* Delete confirm modal */}
            <AnimatePresence>
                {deleteId && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className='fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center px-4'
                        onClick={() => setDeleteId(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.93, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.93, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            onClick={e => e.stopPropagation()}
                            className='bg-white rounded-2xl shadow-2xl p-5 w-full max-w-xs text-center'
                        >
                            <div className='w-12 h-12 rounded-2xl bg-red-50 flex items-center justify-center mx-auto mb-3'>
                                <Trash2 className='w-6 h-6 text-red-500' />
                            </div>
                            <h2 className='font-bold text-gray-800 mb-1'>Delete Coupon?</h2>
                            <p className='text-sm text-gray-400 mb-5'>This action cannot be undone.</p>
                            <div className='flex gap-2'>
                                <button
                                    onClick={() => setDeleteId(null)}
                                    className='flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 cursor-pointer hover:bg-gray-50 transition-all'
                                >
                                    Cancel
                                </button>
                                <motion.button
                                    whileTap={{ scale: 0.96 }}
                                    onClick={() => deleteMutation.mutate(deleteId)}
                                    disabled={deleteMutation.isPending}
                                    className='flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-bold cursor-pointer transition-all flex items-center justify-center gap-1 disabled:opacity-60'
                                >
                                    {deleteMutation.isPending ? <Loader2 className='w-4 h-4 animate-spin' /> : 'Delete'}
                                </motion.button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}

export default ManageCoupons
