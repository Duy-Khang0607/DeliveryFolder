'use client'
import { BadgePlus, Loader2, Package, User, Plus, Box, Banknote, Loader } from 'lucide-react'
import { motion } from 'framer-motion'
import { useState } from 'react'
import axios from 'axios'
import { useToast } from '@/app/components/Toast'
import ButtonHome from '@/app/components/ButtonHome'
import Link from 'next/link'
import { useCategoryOptions, useUnitOptions } from '@/app/hooks/useCategoryUnitOptions'
import SearchableSelect from '@/app/components/SearchableSelect'
import GroceryImagePicker, { GroceryImageValue } from '@/app/components/GroceryImagePicker'

const emptyImage: GroceryImageValue = { file: null, imageUrl: null, preview: null }

const AddGrocery = () => {
  const [name, setName] = useState<string>('')
  const [category, setCategory] = useState<string>('')
  const [unit, setUnit] = useState<string>('')
  const [price, setPrice] = useState<string>('')
  const [stock, setStock] = useState<number>(0)
  const [loading, setLoading] = useState<boolean>(false)
  const [loadingImage, setLoadingImage] = useState<boolean>(false)
  const [imageValue, setImageValue] = useState<GroceryImageValue>(emptyImage)
  const disableAdd = name?.length > 0 && category?.length > 0 && unit?.length > 0 && price?.length > 0 && stock > 0;
  const [categorySearch, setCategorySearch] = useState('')
  const [unitSearch, setUnitSearch] = useState('')
  const { showToast } = useToast();

  const handleSubmit = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault()
    setLoading(true)
    try {
      const formData = new FormData()
      formData.append('name', name)
      formData.append('category', category)
      formData.append('unit', unit)
      formData.append('price', price.replace(/,/g, ''))
      formData.append('stock', stock.toString())
      if (imageValue.file) formData.append('image', imageValue.file)
      if (imageValue.imageUrl) formData.append('imageUrl', imageValue.imageUrl)
      const response: any = await axios.post('/api/auth/admin/add-grocery', formData)
      if (response?.data?.success) {
        showToast(response?.data?.message, "success");
        setName('')
        setCategory('')
        setUnit('')
        setPrice('')
        setStock(0)
        setImageValue(emptyImage)
      } else {
        showToast(response?.data?.message, "error");
      }
      setLoading(false)
    } catch (error) {
      setLoading(false)
      showToast('Add grocery failed !', "error");
    } finally {
      setLoading(false)
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
    <section className='w-[90%] sm:w-[85%] md:w-[80%] mx-auto h-full pt-10'>
      {/* <- and Back to home + View Grocery Link */}
      <div className='min-h-[40px] flex items-center justify-between'>
        <div>
          <ButtonHome />
        </div>

        <div>
          {/* View Grocery button/link, beautiful and clear on the right */}
          <Link
            href="/admin/view-grocery"
            className="md:flex hidden items-center gap-1 px-3 py-1.5 rounded-xl bg-green-50 border border-green-200 text-green-800 hover:bg-green-100 transition-all font-semibold shadow hover:shadow-lg text-sm"
          >
            <Package className="w-4 h-4" />
            <span className="hidden md:inline">View Grocery</span>
          </Link>
        </div>
      </div>

      {/* Form add grocery */}
      <div className='flex justify-center items-center min-h-[calc(100vh-100px)]'>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{
            opacity: 1,
          }}
          transition={{ duration: 1, delay: 0.2 }}
          className='w-full md:max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl px-3 py-5 border border-green-200 h-fit'>

          {/* Title && Description */}
          <div className='flex flex-col items-center justify-center gap-2 tracking-wide text-xl font-semibold px-6'>
            <span className='flex flex-row items-center gap-2 justify-center'>
              <BadgePlus className='w-5 h-5 text-green-700' />
              Add Grocery
            </span>
            <p className='text-sm max-w-sm md:max-w-xl'>Add new grocery item to your store</p>
          </div>

          {/* Image picker */}
          <div className='px-6 mb-4'>
            <GroceryImagePicker
              value={imageValue}
              onChange={setImageValue}
              loading={loadingImage}
              onLoadingChange={setLoadingImage}
              onError={(msg) => showToast(msg, 'error')}
              fileInputId='add-grocery-image'
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

                {/* Category */}
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

                {/* Unit */}
                <div>
                  <label className='text-base font-semibold'>Unit <span className='text-red-500'>*</span></label>
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
                    type="number"
                    placeholder='Enter stock'
                    className={`${inputClass} pr-10`}
                    value={stock}
                    onChange={(e) => setStock(Number(e.target.value))}
                    min={0}
                  />
                </div>
              </div>
            </div>

            {/* Submit */}
            <motion.button
              disabled={!disableAdd || loading}
              onClick={handleSubmit}
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
                  <Plus className='w-4 h-4' />
                  Save Changes
                </>
              )}
            </motion.button>
          </form>

        </motion.div>
      </div>

    </section >
  )
}

export default AddGrocery