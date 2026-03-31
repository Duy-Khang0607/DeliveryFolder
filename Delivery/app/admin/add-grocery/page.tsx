'use client'
import { BadgePlus, Upload, Loader2, Eye, ArrowLeft, Package } from 'lucide-react'
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
      console.error({ error })
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
      formData.append('price', price)
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
      console.error({ error })
      setLoading(false)
      showToast('System error', "error");
    }
  }

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

          <div className='flex flex-col items-center text-center gap-3 mb-8'>
            {/* Desktop Add Grocery Title */}
            <div className='flex flex-row items-center gap-2 tracking-wide text-xl font-semibold'>
              <BadgePlus className='w-5 h-5 text-green-700' />
              Add Grocery
            </div>

            {/* Mobile View Grocery Link */}
            <div className='flex flex-row gap-2 items-center'>
              <Link
                href="/admin/view-grocery"
                className="flex items-center gap-1 px-2 py-1 rounded-md border border-green-100 text-green-700 bg-green-50 hover:bg-green-100 transition-all font-medium text-sm md:hidden"
              >
                <Eye className="w-4 h-4" />
                <span className='text-sm'>View Grocery</span>
              </Link>
            </div>

            <p className='text-sm max-w-sm md:max-w-xl text-green-700 font-medium' style={{ textShadow: '1px 1px 20px green-500' }}>
              Add new grocery item to your store
            </p>
          </div>

          <form className='flex flex-col gap-3' >

            <div className='relative w-full flex flex-col gap-2'>
              <label className='text-base font-semibold'>Grocery Name <span className='text-red-500'>*</span></label>
              <input required type="text" placeholder='Grocery name' className='w-full p-3 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500 transition-all duration-300' value={name} onChange={(e) => setName(e.target.value)} />
            </div>

            <div className='relative w-full flex flex-row gap-3 items-center justify-between'>
              <div className='w-full flex flex-col gap-2'>
                <label className='text-base font-semibold'>Category <span className='text-red-500'>*</span></label>
                <select required className='w-full p-3 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500 transition-all duration-300' value={category} onChange={(e) => setCategory(e.target.value)} >
                  <option value=''>Select category</option>
                  {data?.categories?.map((item: string, index: number) => (
                    <option key={index} value={item}>{item}</option>
                  ))}
                </select>
              </div>
              <div className='w-full flex flex-col gap-2'>
                <label className='text-base font-semibold'>Unit <span className='text-red-500'>*</span></label>
                <select required className='w-full p-3 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500 transition-all duration-300' value={unit} onChange={(e) => setUnit(e.target.value)} >
                  <option value=''>Select units</option>
                  {data?.units?.map((item: string, index: number) => (
                    <option key={index} value={item}>{item}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className='relative w-full flex flex-col gap-2'>
              <label className='text-base font-semibold'>Price <span className='text-red-500'>*</span></label>
              <input required type="number" placeholder='$' className='w-full p-3 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500 transition-all duration-300' value={price} onChange={(e) => setPrice(e.target.value)} />
            </div>

            <div className='w-full md:max-w-[160px] h-auto flex flex-row gap-3 text-green-700 items-center'>
              <label
                htmlFor="file-upload"
                className="w-[160px] shrink-0 flex-none p-3 h-full rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500 pl-10 transition-all duration-300 cursor-pointer relative" onClick={(e) => e.stopPropagation()}
              >
                Upload image
                <Upload className='w-5 h-5 absolute top-3.5 left-2.5' />
              </label>
              <input
                type="file"
                id="file-upload"
                className="hidden"
                onChange={handleFileChange}
                accept='image/*'
              />
              {preview ? (
                loadingImage ? (
                  <div className='w-full'>
                    <Loader2 className='w-20 h-10 animate-spin' />
                  </div>
                ) : (
                  <Image
                    onClick={() => setOpen(true)}
                    src={preview}
                    width={100}
                    height={100}
                    alt="Image upload"
                    className="object-cover bg-white border-gray-300 border shadow-2xl rounded-2xl cursor-pointer hover:border-gray-500 transition-all duration-200"
                  />
                )
              ) : null}

              <AnimatePresence>
                {open && preview && (
                  <PopupImage image={preview} setOpen={setOpen} />
                )}
              </AnimatePresence>
            </div>

            <motion.button disabled={!disableAdd || loading} onClick={handleSubmit} type="submit" className={`${disableAdd ? 'bg-green-500 hover:bg-green-400' : 'bg-gray-300'} rounded-md mt-5  cursor-pointer transition-all text-center p-2 text-white flex justify-center`}>{loading ? <Loader2 className='w-5 h-5 animate-spin' /> : 'Add Grocery'}</motion.button>

          </form>

        </motion.div>
      </div>

    </section >
  )
}

export default AddGrocery