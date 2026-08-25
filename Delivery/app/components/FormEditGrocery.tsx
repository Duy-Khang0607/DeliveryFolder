'use client'
import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { BadgePlus, Banknote, Edit, Loader, Loader2, User, Box } from 'lucide-react'
import { useToast } from './Toast'
import axios from 'axios'
import { IGrocery } from '../models/grocery.model'
import { useCategoryOptions, useUnitOptions } from '../hooks/useCategoryUnitOptions'
import SearchableSelect from './SearchableSelect'
import GroceryImagePicker, { GroceryImageValue } from './GroceryImagePicker'


interface FormGroceryProps {
    isEdit: boolean,
    title: string,
    description: string,
    setEdit: React.Dispatch<React.SetStateAction<boolean>>,
    editItem: IGrocery | null,
    fetchGrocery: () => void
}


const FormEditGrocery = ({ isEdit, title, description, setEdit, editItem, fetchGrocery }: FormGroceryProps) => {
    const [loading, setLoading] = useState<boolean>(false)
    const [loadingImage, setLoadingImage] = useState<boolean>(false)
    const [imageValue, setImageValue] = useState<GroceryImageValue>({
        file: null,
        imageUrl: null,
        preview: editItem?.image?.[0] ?? null,
    })
    const disableAdd = editItem?.name.toString() && editItem?.category.toString() && (editItem?.unit?.toString() || '') && editItem?.price.toString() && editItem?.stock > 0;
    const { showToast } = useToast();
    const [name, setName] = useState<string>(editItem?.name.toString() || '')
    const [category, setCategory] = useState<string>(editItem?.category.toString() || '')
    const [unit, setUnit] = useState<string>(editItem?.unit?.toString() || '')
    const [price, setPrice] = useState<string>(editItem?.price?.toLocaleString('vi-VN') || '')
    const [stock, setStock] = useState<number>(editItem?.stock || 0)
    const [categorySearch, setCategorySearch] = useState('')
    const [unitSearch, setUnitSearch] = useState('')


    const handleUpdate = async (e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault()
        setLoading(true)
        try {
            const formData = new FormData()
            formData.append('_id', editItem?._id?.toString() || '')
            formData.append('name', name)
            formData.append('category', category)
            formData.append('unit', unit)
            formData.append('price', price.replace(/,/g, ''))
            formData.append('stock', stock.toString())
            if (imageValue.file) formData.append('image', imageValue.file)
            if (imageValue.imageUrl) formData.append('imageUrl', imageValue.imageUrl)
            const response: any = await axios.put('/api/auth/admin/update-grocery', formData)
            if (response?.data?.success) {
                showToast(response?.data?.message, "success");
                setEdit(false)
                await fetchGrocery()
            } else {
                showToast(response?.data?.message, "error");
                setEdit(false)
            }
            setLoading(false)
        } catch (error) {
            setLoading(false)
            showToast('Failed to update grocery !', 'error');
            setEdit(false)
        }
    }

    const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const raw = e.target.value.replace(/,/g, '') // bỏ dấu phẩy cũ
        if (!/^\d*$/.test(raw)) return              // chỉ cho nhập số
        const formatted = raw ? Number(raw).toLocaleString('vi-VN') : ''
        setPrice(formatted)
    }

    const { data: categoryOptions = [], isLoading: categoriesLoading } = useCategoryOptions(categorySearch)
    const { data: unitOptions = [], isLoading: unitsLoading } = useUnitOptions(unitSearch)

    const labelClass = 'text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 flex items-center gap-1.5'
    const inputClass = 'w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 text-sm placeholder:text-gray-400'

    return (
        <div
            className="fixed inset-0 z-999 flex items-center justify-center bg-black/60 backdrop-blur-sm"
            onClick={() => setEdit(false)}
        >
            <motion.div
                className="relative w-full md:max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl bg-white shadow-2xl border border-gray-100 py-5"
                initial={{ scale: 0.94, opacity: 0, y: 16 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.94, opacity: 0, y: 16 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
                onClick={(e) => e.stopPropagation()}
            >

                {/* Title && Description */}
                <div className='flex flex-col items-center justify-center gap-2 tracking-wide text-xl font-semibold px-6'>
                    <span className='flex flex-row items-center gap-2 justify-center'>
                        {isEdit ? <Edit className='w-5 h-5 text-green-700' /> : <BadgePlus className='w-5 h-5 text-green-700' />}
                        {title}
                    </span>
                    <p className='text-sm max-w-sm md:max-w-xl'>{description}</p>
                </div>

                <div className='px-6 mb-4'>
                    <GroceryImagePicker
                        value={imageValue}
                        onChange={setImageValue}
                        loading={loadingImage}
                        onLoadingChange={setLoadingImage}
                        onError={(msg) => showToast(msg, 'error')}
                        fileInputId='edit-grocery-image'
                    />
                </div>

                {/* Form body */}
                <form className='px-6 pb-6 flex flex-col gap-4'>
                    {/* Section: Personal Info */}
                    <div className='bg-gray-50 rounded-2xl p-4 flex flex-col gap-3 border border-gray-100'>
                        <p className='text-xs font-bold text-gray-400 uppercase tracking-widest'>Grocery Info</p>

                        {/* Grocry name */}
                        <div>
                            <label className={labelClass}>
                                <User className='w-3.5 h-3.5' /> Grocery Name
                            </label>
                            <input
                                required
                                type="text"
                                placeholder='Enter full name'
                                className={inputClass}
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                            />
                        </div>

                        {/* Category - Unit */}
                        <div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>
                            <div>
                                <label className={labelClass}>
                                    <Box className='w-3.5 h-3.5' /> Category
                                </label>
                                <SearchableSelect
                                    value={category}
                                    onChange={setCategory}
                                    options={categoryOptions}
                                    isLoading={categoriesLoading}
                                    onSearchChange={setCategorySearch}
                                    placeholder="Search category..."
                                    inputClassName={inputClass}
                                />
                            </div>
                            <div>
                                <label className={labelClass}>
                                    <Box className='w-3.5 h-3.5' /> Unit
                                </label>
                                <SearchableSelect
                                    value={unit}
                                    onChange={setUnit}
                                    options={unitOptions}
                                    isLoading={unitsLoading}
                                    onSearchChange={setUnitSearch}
                                    placeholder="Search unit..."
                                    inputClassName={inputClass}
                                />
                            </div>
                        </div>

                        {/* Price */}
                        <div>
                            <label className={labelClass}>
                                <Banknote className='w-3.5 h-3.5' /> Price (VND)
                            </label>
                            <div className='relative'>
                                <input
                                    type="text"
                                    placeholder='Nhập giá (VND)'
                                    className={`${inputClass} pr-10`}
                                    value={price} onChange={handlePriceChange}
                                />
                            </div>
                        </div>

                        {/* Stock */}
                        <div>
                            <label className={labelClass}>
                                <Box className='w-3.5 h-3.5' /> Stock
                            </label>
                            <div className='relative'>
                                <input
                                    type="text"
                                    placeholder='Enter stock'
                                    className={`${inputClass} pr-10`}
                                    value={stock}
                                    onChange={(e) => setStock(Number(e.target.value))}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Submit */}
                    <motion.button
                        disabled={!disableAdd || loading}
                        onClick={handleUpdate}
                        type="submit"
                        whileTap={{ scale: 0.98 }}
                        whileHover={{ scale: 1.01 }}
                        className={`w-full py-3 rounded-2xl font-bold text-black text-sm tracking-wide flex items-center justify-center gap-2 transition-all duration-200 shadow-lg ${disableAdd && !loading ? 'bg-linear-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 shadow-green-200 cursor-pointer bg-green-400' : 'bg-gray-300 cursor-not-allowed shadow-none'}`}
                    >
                        {loading ? (
                            <>
                                <Loader2 className='w-4 h-4 animate-spin' />
                                Updating...
                            </>
                        ) : (
                            <>
                                <Edit className='w-4 h-4' />
                                Save Changes
                            </>
                        )}
                    </motion.button>
                </form>
            </motion.div>
        </div>
    )
}

export default FormEditGrocery