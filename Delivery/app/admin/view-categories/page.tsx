'use client'
import { AnimatePresence, motion } from 'framer-motion'
import { useState } from 'react'
import axios from 'axios'
import {
    Plus, Edit, Trash2, ToggleLeft, ToggleRight,
    Loader2, ArrowLeft, FolderOpen, Ruler, X, Check
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/app/components/Toast'
import { useQueryClient, useMutation, useQuery } from '@tanstack/react-query'
import { useCategoriesPaginated } from '@/app/hooks/useCategoriesPaginated'
import { useUnitsPaginated } from '@/app/hooks/useUnitPaginated'
import SearchInput from '@/app/components/SearchInput'
import { ICategories } from '@/app/models/categories.model'
import { IUnits } from '@/app/models/units.model'
import Pagination from '@/app/components/Pagination'

// ─── Inline Form Component ────────────────────────────────
const InlineForm = ({
    placeholder, onSave, onCancel, defaultValue = ''
}: {
    placeholder: string
    onSave: (value: string) => void
    onCancel: () => void
    defaultValue?: string
}) => {
    const [value, setValue] = useState(defaultValue)
    return (
        <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className='flex items-center gap-2 p-2 bg-green-50 rounded-xl border border-green-200 relative'
        >
            <input
                autoFocus
                value={value}
                onChange={e => setValue(e.target.value)}
                placeholder={placeholder}
                className='flex-1 bg-transparent text-sm font-medium text-gray-800 outline-none placeholder:text-gray-400'
                onKeyDown={e => e.key === 'Enter' && value.trim() && onSave(value.trim())}
            />
            <div className='absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1.5'>
                <button
                    onClick={() => value.trim() && onSave(value.trim())}
                    className='p-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all cursor-pointer'
                >
                    <Check className='w-3.5 h-3.5' />
                </button>
                <button
                    onClick={onCancel}
                    className='p-1.5 bg-gray-200 text-gray-600 rounded-lg hover:bg-gray-300 transition-all cursor-pointer'
                >
                    <X className='w-3.5 h-3.5' />
                </button>
            </div>
        </motion.div>
    )
}

// ─── Main Page ────────────────────────────────────────────
const ManageCategoriesPage = () => {
    const router = useRouter()
    const { showToast } = useToast()
    const queryClient = useQueryClient()

    // Tab: 'categories' | 'units'
    const [activeTab, setActiveTab] = useState<'categories' | 'units'>('categories')

    // Inline add/edit state
    const [addingCategory, setAddingCategory] = useState(false)
    const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null)
    const [addingUnit, setAddingUnit] = useState(false)
    const [editingUnitId, setEditingUnitId] = useState<string | null>(null)

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);

    // Search
    const [debouncedSearch, setDebouncedSearch] = useState('')

    // ── Fetch Categories and Units ──────────────────────────────────────────────
    const { data: catData, isLoading: catLoading } = useCategoriesPaginated(currentPage, debouncedSearch)
    const catTotalPages = catData?.pagination?.totalPages ?? 1
    const catTotalItems = catData?.pagination?.totalItems ?? 0


    const { data: unitData, isLoading: unitLoading } = useUnitsPaginated(currentPage, debouncedSearch)
    const unitTotalPages = unitData?.pagination?.totalPages ?? 1
    const unitTotalItems = unitData?.pagination?.totalItems ?? 0

    const categories = catData?.categories as ICategories[] ?? []

    const units = unitData?.units as IUnits[] ?? []

    // ── Categories ──────────────────────────────────────────
    const addCategory = useMutation({
        mutationFn: (name: string) => axios.post('/api/auth/admin/add-categories', { name, isActive: true }),
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['categories', 'pagination', currentPage, debouncedSearch] }); setAddingCategory(false); showToast('Category added', 'success') },
        onError: () => showToast('Failed to add category', 'error')
    })

    const updateCategory = useMutation({
        mutationFn: ({ id, name }: { id: string, name: string }) => axios.put(`/api/auth/admin/update-categories/${id}`, { name }),
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['categories', 'pagination', currentPage, debouncedSearch] }); setEditingCategoryId(null); showToast('Category updated', 'success') },
        onError: () => showToast('Failed to update', 'error')
    })

    const toggleCategory = useMutation({
        mutationFn: ({ id, isActive }: { id: string, isActive: boolean }) => axios.put(`/api/auth/admin/update-categories/${id}`, { isActive }),
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['categories', 'pagination', currentPage, debouncedSearch] }); showToast('Category updated', 'success') },
    })

    const deleteCategory = useMutation({
        mutationFn: (id: string) => axios.delete(`/api/auth/admin/delete-categories/${id}`),
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['categories', 'pagination', currentPage, debouncedSearch] }); showToast('Category deleted', 'success') },
        onError: (err: any) => showToast(err?.response?.data?.message || 'Cannot delete — category in use', 'error')
    })

    // ── Units ──────────────────────────────────────────
    const addUnit = useMutation({
        mutationFn: (name: string) => axios.post('/api/auth/admin/add-units', { name, isActive: true }),
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['units', 'pagination', currentPage, debouncedSearch] }); setAddingUnit(false); showToast('Unit added', 'success') },
        onError: () => showToast('Failed to add unit', 'error')
    })

    const updateUnit = useMutation({
        mutationFn: ({ id, name }: { id: string, name: string }) => axios.put(`/api/auth/admin/update-units/${id}`, { name }),
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['units', 'pagination', currentPage, debouncedSearch] }); setEditingUnitId(null); showToast('Unit updated', 'success') },
        onError: () => showToast('Failed to update', 'error')
    })

    const toggleUnit = useMutation({
        mutationFn: ({ id, isActive }: { id: string, isActive: boolean }) => axios.put(`/api/auth/admin/update-units/${id}`, { isActive }),
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['units', 'pagination', currentPage, debouncedSearch] }); showToast('Unit updated', 'success') },
    })

    const deleteUnit = useMutation({
        mutationFn: (id: string) => axios.delete(`/api/auth/admin/delete-units/${id}`),
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['units', 'pagination', currentPage, debouncedSearch] }); showToast('Unit deleted', 'success') },
        onError: (err: any) => showToast(err?.response?.data?.message || 'Cannot delete — unit in use', 'error')
    })

    // ── Pagination ──────────────────────────────────────────
    const handlePrevPage = () => {
        if (currentPage > 1) {
            setCurrentPage(prev => prev - 1)
        }
    }

    const handleNextPage = () => {
        if (currentPage < catTotalPages) {
            setCurrentPage(prev => prev + 1)
        }
    }

    const isLoading = activeTab === 'categories' ? catLoading : unitLoading

    return (
        <div className='min-h-screen bg-gray-50'>
            {/* ── Fixed Header ── */}
            <div className='fixed top-0 left-0 w-full bg-white/80 backdrop-blur-xl border-b border-gray-100 shadow-sm z-50'>
                <div className='max-w-3xl mx-auto px-4 py-3 flex items-center gap-3'>
                    <button
                        onClick={() => router.push('/')}
                        className='p-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-600 transition-all cursor-pointer'
                    >
                        <ArrowLeft className='w-4 h-4' />
                    </button>
                    <div className='flex-1'>
                        <h1 className='font-extrabold text-lg text-gray-800 leading-tight'>Categories & Units</h1>
                        <p className='text-xs text-gray-400'>
                            {categories.length} categories · {units.length} units
                        </p>
                    </div>
                    {/* Add button theo tab */}
                    <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={() => activeTab === 'categories' ? setAddingCategory(true) : setAddingUnit(true)}
                        className='flex items-center gap-1.5 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm'
                    >
                        <Plus className='w-3.5 h-3.5' />
                        Add {activeTab === 'categories' ? 'Category' : 'Unit'}
                    </motion.button>
                </div>

                {/* Tab bar */}
                <div className='max-w-3xl mx-auto px-4 pb-3 flex gap-2'>
                    {(['categories', 'units'] as const).map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer
                                ${activeTab === tab
                                    ? 'bg-green-600 text-white shadow-sm'
                                    : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                        >
                            {tab === 'categories' ? <FolderOpen className='w-3.5 h-3.5' /> : <Ruler className='w-3.5 h-3.5' />}
                            {tab === 'categories' ? 'Categories' : 'Units'}
                        </button>
                    ))}
                </div>
            </div>

            {/* ── Content ── */}
            <div className='max-w-3xl mx-auto px-4 pt-36 pb-24'>
                {/* Search */}
                <div className='mb-4'>
                    <SearchInput onSearch={setDebouncedSearch} placeholder='Search for a category or unit' />
                </div>

                {isLoading ? (
                    <div className='flex items-center justify-center py-20'>
                        <Loader2 className='w-8 h-8 animate-spin text-green-600' />
                    </div>
                ) : (
                    <AnimatePresence mode='wait'>

                        {/* ── CATEGORIES TAB ── */}
                        {activeTab === 'categories' && (
                            <motion.div
                                key='categories'
                                initial={{ opacity: 0, x: -16 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -16 }}
                                transition={{ duration: 0.25 }}
                                className='flex flex-col gap-2'
                            >
                                {/* Inline add form */}
                                <AnimatePresence>
                                    {addingCategory && (
                                        <InlineForm
                                            placeholder='New category name...'
                                            onSave={name => addCategory.mutate(name)}
                                            onCancel={() => setAddingCategory(false)}
                                        />
                                    )}
                                </AnimatePresence>

                                {/* Stats bar */}
                                <div className='flex gap-3 mb-2'>
                                    <div className='flex-1 bg-white rounded-xl border border-gray-100 p-3 text-center shadow-sm'>
                                        <p className='text-xs text-gray-400'>Total</p>
                                        <p className='text-xl font-extrabold text-gray-800'>{categories?.length}</p>
                                    </div>
                                    <div className='flex-1 bg-white rounded-xl border border-green-100 p-3 text-center shadow-sm'>
                                        <p className='text-xs text-gray-400'>Active</p>
                                        <p className='text-xl font-extrabold text-green-600'>{categories?.filter(c => c.isActive)?.length}</p>
                                    </div>
                                    <div className='flex-1 bg-white rounded-xl border border-gray-100 p-3 text-center shadow-sm'>
                                        <p className='text-xs text-gray-400'>Inactive</p>
                                        <p className='text-xl font-extrabold text-gray-400'>{categories?.filter(c => !c.isActive)?.length}</p>
                                    </div>
                                </div>

                                {/* Category list */}
                                {categories?.map((cat, index) => (
                                    <motion.div
                                        key={cat._id.toString()}
                                        initial={{ opacity: 0, y: 8 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.25, delay: index * 0.03 }}
                                        className={`bg-white rounded-2xl border shadow-sm transition-all duration-200
                                            ${cat?.isActive ? 'border-gray-100' : 'border-gray-100 opacity-10'}`}
                                    >
                                        {editingCategoryId === cat?._id?.toString() ? (
                                            <div className='p-3'>
                                                <InlineForm
                                                    placeholder='Category name...'
                                                    defaultValue={cat.name}
                                                    onSave={name => updateCategory?.mutate({ id: cat?._id?.toString(), name })}
                                                    onCancel={() => setEditingCategoryId(null)}
                                                />
                                            </div>
                                        ) : (
                                            <div className='flex items-center gap-3 px-4 py-3'>
                                                {/* Icon */}
                                                <div className='w-9 h-9 rounded-xl bg-green-50 flex items-center justify-center shrink-0'>
                                                    <span className='text-lg'>📦</span>
                                                </div>

                                                {/* Name + badge */}
                                                <div className='flex-1 min-w-0'>
                                                    <p className='text-sm font-bold text-gray-800 truncate'>{cat?.name}</p>
                                                </div>

                                                {/* Active badge */}
                                                <span className={`shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold
                                                    ${cat?.isActive ? 'bg-green-50 text-green-600 border border-green-200' : 'bg-gray-100 text-gray-400'}`}>
                                                    {cat?.isActive ? 'Active' : 'Hidden'}
                                                </span>

                                                {/* Actions */}
                                                <div className='flex items-center gap-1.5 shrink-0'>
                                                    {/* Toggle active */}
                                                    <button
                                                        onClick={() => toggleCategory?.mutate({ id: cat?._id?.toString(), isActive: !cat?.isActive })}
                                                        className='p-1.5 rounded-lg hover:bg-gray-100 transition-all cursor-pointer text-gray-400'
                                                        title={cat?.isActive ? 'Deactivate' : 'Activate'}
                                                    >
                                                        {cat?.isActive
                                                            ? <ToggleRight className='w-4 h-4 text-green-500' />
                                                            : <ToggleLeft className='w-4 h-4' />}
                                                    </button>
                                                    {/* Edit */}
                                                    <button
                                                        onClick={() => setEditingCategoryId(cat._id.toString())}
                                                        className='p-1.5 rounded-lg bg-green-50 hover:bg-green-100 text-green-600 transition-all cursor-pointer'
                                                    >
                                                        <Edit className='w-3.5 h-3.5' />
                                                    </button>
                                                    {/* Delete — disable nếu đang có grocery dùng */}
                                                    <button
                                                        onClick={() => {
                                                            deleteCategory.mutate(cat._id.toString())
                                                        }}
                                                        className='p-1.5 rounded-lg transition-all cursor-pointer bg-red-50 hover:bg-red-100 text-red-500'
                                                    >
                                                        <Trash2 className='w-3.5 h-3.5' />
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </motion.div>
                                ))}
                            </motion.div>
                        )}

                        {/* ── UNITS TAB ── */}
                        {activeTab === 'units' && (
                            <motion.div
                                key='units'
                                initial={{ opacity: 0, x: 16 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 16 }}
                                transition={{ duration: 0.25 }}
                                className='flex flex-col gap-2'
                            >
                                <AnimatePresence>
                                    {addingUnit && (
                                        <InlineForm
                                            placeholder='e.g. Kilogram (kg)'
                                            onSave={name => addUnit.mutate(name)}
                                            onCancel={() => setAddingUnit(false)}
                                        />
                                    )}
                                </AnimatePresence>

                                {/* Stats bar */}
                                <div className='flex gap-3 mb-2'>
                                    <div className='flex-1 bg-white rounded-xl border border-gray-100 p-3 text-center shadow-sm'>
                                        <p className='text-xs text-gray-400'>Total</p>
                                        <p className='text-xl font-extrabold text-gray-800'>{units?.length}</p>
                                    </div>
                                    <div className='flex-1 bg-white rounded-xl border border-green-100 p-3 text-center shadow-sm'>
                                        <p className='text-xs text-gray-400'>Active</p>
                                        <p className='text-xl font-extrabold text-green-600'>{units?.filter(u => u.isActive)?.length}</p>
                                    </div>
                                    <div className='flex-1 bg-white rounded-xl border border-gray-100 p-3 text-center shadow-sm'>
                                        <p className='text-xs text-gray-400'>Inactive</p>
                                        <p className='text-xl font-extrabold text-gray-400'>{units?.filter(u => !u.isActive)?.length}</p>
                                    </div>
                                </div>

                                {/* Grid 2 cols trên mobile, 3 cols trên md */}
                                <div className='grid grid-cols-2 md:grid-cols-3 gap-3'>
                                    {units.map((unit, index) => (
                                        <motion.div
                                            key={unit?._id?.toString()}
                                            initial={{ opacity: 0, scale: 0.95 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            transition={{ duration: 0.2, delay: index * 0.02 }}
                                            className='bg-white rounded-2xl border border-gray-100 shadow-sm p-3 flex flex-col gap-2'
                                        >
                                            {editingUnitId === unit?._id?.toString() ? (
                                                <InlineForm
                                                    placeholder='Unit name...'
                                                    defaultValue={unit.name}
                                                    onSave={name => updateUnit.mutate({ id: unit?._id?.toString(), name })}
                                                    onCancel={() => setEditingUnitId(null)}
                                                />
                                            ) : (
                                                <>
                                                    <div className='flex items-center gap-2'>
                                                        <div className='w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center shrink-0'>
                                                            <Ruler className='w-3.5 h-3.5 text-blue-500' />
                                                        </div>
                                                        <p className='text-xs font-bold text-gray-800 leading-tight line-clamp-2 flex-1'>{unit.name}</p>
                                                    </div>

                                                    <div className='flex items-center gap-1.5 justify-end'>

                                                        {/* Active badge */}
                                                        <span className={`shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold
                                                        ${unit?.isActive ? 'bg-green-50 text-green-600 border border-green-200' : 'bg-gray-100 text-gray-400'}`}>
                                                            {unit?.isActive ? 'Active' : 'Hidden'}
                                                        </span>

                                                        {/* Toggle active */}
                                                        <button
                                                            onClick={() => toggleUnit?.mutate({ id: unit?._id?.toString(), isActive: !unit?.isActive })}
                                                            className='p-1.5 rounded-lg hover:bg-gray-100 transition-all cursor-pointer text-gray-400'
                                                            title={unit?.isActive ? 'Deactivate' : 'Activate'}
                                                        >
                                                            {unit?.isActive
                                                                ? <ToggleRight className='w-4 h-4 text-green-500' />
                                                                : <ToggleLeft className='w-4 h-4' />}
                                                        </button>

                                                        <button
                                                            onClick={() => setEditingUnitId(unit?._id?.toString())}
                                                            className='p-1 rounded-lg bg-green-50 text-green-600 hover:bg-green-100 transition-all cursor-pointer'
                                                        >
                                                            <Edit className='w-3 h-3' />
                                                        </button>
                                                        <button
                                                            onClick={() => deleteUnit.mutate(unit?._id?.toString())}
                                                            className='p-1 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 transition-all cursor-pointer'
                                                        >
                                                            <Trash2 className='w-3 h-3' />
                                                        </button>
                                                    </div>
                                                </>
                                            )}
                                        </motion.div>
                                    ))}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                )}
            </div>

            {/* Pagination Categories  */}
            {catTotalItems > 0 && activeTab === 'categories' && (
                <Pagination totalPages={catTotalPages} handlePrevPage={handlePrevPage} handleNextPage={handleNextPage} currentPage={currentPage} setCurrentPage={setCurrentPage} />
            )}

            {/* Pagination Units  */}
            {unitTotalItems > 0 && activeTab === 'units' && (
                <Pagination totalPages={unitTotalPages} handlePrevPage={handlePrevPage} handleNextPage={handleNextPage} currentPage={currentPage} setCurrentPage={setCurrentPage} />
            )}
        </div>
    )
}

export default ManageCategoriesPage