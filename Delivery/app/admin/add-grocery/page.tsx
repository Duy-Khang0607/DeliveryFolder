'use client'
import { BadgePlus, Loader2, Package, User, Plus, Box, DollarSign, Camera } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import { ChangeEvent, useState } from 'react'
import Image from 'next/image'
import axios from 'axios'
import { useToast } from '@/app/components/Toast'
import PopupImage from '@/app/HOC/PopupImage'
import ButtonHome from '@/app/components/ButtonHome'
import { data } from '@/app/data'
import Link from 'next/link'

const AddGrocery = () => {
  const [name, setName] = useState<string>('')
  const [category, setCategory] = useState<string>('')
  const [unit, setUnit] = useState<string>('')
  const [price, setPrice] = useState<string>('')
  const [loading, setLoading] = useState<boolean>(false)
  const [loadingImage, setLoadingImage] = useState<boolean>(false)
  const [backendImage, setBackendImage] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>()
  const disableAdd = name?.length > 0 && category?.length > 0 && unit?.length > 0 && price?.length > 0;
  const [open, setOpen] = useState(false);
  const { showToast } = useToast();

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    e.preventDefault()
    setLoadingImage(true)
    try {
      const file = e?.target.files;
      if (!file || file.length == 0) return
      const filterFile = file[0];
      setBackendImage(filterFile)
      setPreview(URL.createObjectURL(filterFile))
      setLoadingImage(false)
    } catch (error) {
      showToast('Upload image failed !', "error");
      setLoadingImage(false)
    }
  }

  const handleSubmit = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault()
    setLoading(true)
    try {
      const formData = new FormData()
      formData.append('name', name)
      formData.append('category', category)
      formData.append('unit', unit)
      formData.append('price', price.replace(/,/g, ''))
      if (backendImage) formData.append('image', backendImage)
      const response: any = await axios.post('/api/auth/admin/add-grocery', formData)
      if (response?.data?.success) {
        showToast(response?.data?.message, "success");
        setName('')
        setCategory('')
        setUnit('')
        setPrice('')
        setBackendImage(null)
        setPreview(null)
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
    const formatted = raw ? Number(raw).toLocaleString('en-US') : ''
    setPrice(formatted)
  }

  const labelClass = 'text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 flex items-center gap-1.5'
  const inputClass = 'w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 text-sm placeholder:text-gray-400'
  const avatarSrc = preview || (typeof backendImage === 'string' ? backendImage : '')

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

          {/* Avatar overlap */}
          <div className='relative -mt-10 px-6 mb-4 flex items-end gap-4'>
            <div className='relative shrink-0'>
              <div className='w-20 h-20 rounded-2xl border-4 border-white shadow-xl overflow-hidden bg-gray-100'>
                {loadingImage ? (
                  <div className='w-full h-full flex items-center justify-center'>
                    <Loader2 className='w-6 h-6 animate-spin text-green-600' />
                  </div>
                ) : avatarSrc ? (
                  <Image
                    onClick={() => setOpen(true)}
                    src={avatarSrc}
                    width={80}
                    height={80}
                    alt="Avatar"
                    className="object-cover w-full h-full cursor-pointer"
                  />
                ) : (
                  <div className='w-full h-full flex items-center justify-center bg-linear-to-br from-green-100 to-emerald-200'>
                    <Box className='w-8 h-8 text-green-600' />
                  </div>
                )}
              </div>
              <label
                htmlFor="file-upload"
                className='absolute top-0 right-0 bg-green-600 hover:bg-green-700 text-white rounded-lg p-1.5 cursor-pointer shadow-md transition-all'
                onClick={(e) => e.stopPropagation()}
              >
                <Camera className='w-5 h-5' />
              </label>
              <input type="file" id="file-upload" className="hidden" onChange={handleFileChange} accept='image/*' />
            </div>

            <AnimatePresence>
              {open && avatarSrc && (
                <PopupImage image={avatarSrc} setOpen={setOpen} />
              )}
            </AnimatePresence>
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
                  <select required className={inputClass} value={category} onChange={(e) => setCategory(e.target.value)} >
                    <option value=''>Select category</option>
                    {data?.categories?.map((item: string, index: number) => (
                      <option key={index} value={item}>{item}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className='text-base font-semibold'>Unit <span className='text-red-500'>*</span></label>
                  <select required className={inputClass} value={unit} onChange={(e) => setUnit(e.target.value)} >
                    <option value=''>Select units</option>
                    {data?.units?.map((item: string, index: number) => (
                      <option key={index} value={item}>{item}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Price */}
              <div>
                <label className={labelClass}>
                  <DollarSign className='w-3.5 h-3.5' /> Price
                </label>
                <div className='relative'>
                  <input
                    type="text"
                    placeholder='Enter price'
                    className={`${inputClass} pr-10`}
                    value={price} onChange={handlePriceChange}
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