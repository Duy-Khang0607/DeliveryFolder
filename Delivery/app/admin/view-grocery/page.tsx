'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { IGrocery } from '@/app/models/grocery.model'
import { useEffect, useState } from 'react'
import axios from 'axios'
import { Box, DollarSign, Edit, Package, Plus, Search, Tag, Trash2 } from 'lucide-react'
import Image from 'next/image'
import FormEditGrocery from '@/app/components/FormEditGrocery'
import ButtonHome from '@/app/components/ButtonHome'
import { useToast } from '@/app/components/Toast'
import PopupImage from '@/app/HOC/PopupImage'
import Link from 'next/link'
import Pagination from '@/app/components/Pagination'

const ViewGrocery = () => {
  const [groceries, setGrocery] = useState<IGrocery[]>([])
  const [loading, setLoading] = useState(false)
  const [isEdit, setEdit] = useState<boolean>(false)
  const [editItem, setEditItem] = useState<IGrocery | null>(null)
  const [search, setSearch] = useState<string>('')
  const [filter, setFilter] = useState<IGrocery[]>([])
  const { showToast } = useToast();
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const itemsPerPage = 10
  const [open, setOpen] = useState(false)


  const fetchGrocery = async (page: number = 1) => {
    try {
      setLoading(true)
      const res = await axios.get(`/api/auth/admin/get-grocery?page=${page}&limit=${itemsPerPage}`)
      if (res?.data?.success) {
        setGrocery(res?.data?.groceries)
        setFilter(res?.data?.groceries)
        setTotalPages(res?.data?.pagination?.totalPages)
        setTotalItems(res?.data?.pagination?.totalItems || 0)
      }
    } catch (error: any) {
      showToast(`${error?.response?.data?.message || 'System error !'}`, "error");
    } finally {
      setLoading(false)
    }
  }

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(prev => prev - 1)
    }
  }

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(prev => prev + 1)
    }
  }

  const handleSearchGrocery = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const value = search.toLowerCase()

    setFilter(groceries?.filter((item: IGrocery) => item?.name?.toLowerCase()?.includes(value) || item?.category?.toLowerCase()?.includes(value)))
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this grocery?')) return
    try {
      const res = await axios.delete(`/api/auth/admin/delete-grocery`, { data: { id: id } })
      if (res?.data?.success) {
        showToast(res?.data?.message, "success");
        await fetchGrocery()
      } else {
        showToast(res?.data?.message, "error");
      }
    } catch (error) {
      console.error({ error })
      showToast('System error', "error");
    }
  }

  useEffect(() => {
    fetchGrocery(currentPage)
  }, [currentPage])

  return (
    <>
      {loading ? (
        <motion.div
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: [0, -10, 0], opacity: 1 }}
          transition={{
            delay: 0.2,
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className='flex flex-col items-center justify-center min-h-screen'
        >
          <Box className='w-25 h-25 md:w-50 md:h-50 text-green-700 mb-5' />
        </motion.div>
      ) : (
        <>
          <motion.div className='w-[90%] sm:w-[85%] md:w-[80%] mx-auto h-full pt-10'>
            {/* Back to home */}
            <div className='min-h-[40px] flex items-center justify-between'>
              <div>
                <ButtonHome />
              </div>

              <div>
                {/* View Grocery button/link, beautiful and clear on the right */}
                <Link
                  href="/admin/add-grocery"
                  className="md:flex hidden items-center gap-1 px-3 py-1.5 rounded-xl bg-green-50 border border-green-200 text-green-800 hover:bg-green-100 transition-all font-semibold shadow hover:shadow-lg text-sm"
                >
                  <Plus className="w-4 h-4" />
                  <span className="hidden md:inline">Add Grocery</span>
                </Link>
              </div>
            </div>

            {/* Search */}
            <motion.form
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className='w-full h-full flex flex-row justify-center items-center'
              onSubmit={handleSearchGrocery}
            >
              <div className='relative w-full max-w-lg'>
                <input
                  type="text"
                  id='search'
                  placeholder='Search for a grocery'
                  className='w-full h-full rounded-md p-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500 pr-10'
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                  }}
                />
                <motion.button
                  type='submit'
                  whileTap={{ scale: 0.97 }}
                  whileHover={{ scale: 1.06 }}
                  className='absolute right-0 top-0 bg-green-700 text-white rounded-r-md p-2 hover:bg-green-800 cursor-pointer transition-all duration-200 w-auto h-full'

                >
                  <Search className='w-5 h-5' />
                </motion.button>
              </div>
            </motion.form>

            {/* Grocery items */}
            {filter?.length > 0 ? (
              <>
                <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 py-5 w-full'>
                  {filter?.map((item: IGrocery, index: number) => {
                    return (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.35, delay: index * 0.04 }}
                        className='group relative bg-white rounded-2xl border border-gray-100 shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col'
                      >
                        {/* Top accent bar */}
                        <div className='h-1 w-full bg-linear-to-r from-green-400 to-green-700' />

                        {/* Form details */}
                        <div className='p-4 flex flex-col gap-3 flex-1'>
                          {/* Header: image + name + category */}
                          <div className='flex flex-row gap-3 items-start'>
                            {/* Product image */}
                            <div className='relative w-16 h-16 shrink-0 rounded-xl overflow-hidden border border-gray-100 shadow cursor-pointer'
                              onClick={() => { setOpen(true); setEditItem(item) }}
                            >
                              <Image
                                src={item?.image[0]}
                                alt={item?.name}
                                fill
                                className='object-cover group-hover:scale-110 transition-transform duration-300'
                              />
                            </div>

                            {/* Name + category badge */}
                            <div className='flex flex-col gap-1.5 min-w-0 flex-1'>
                              <span className='flex items-center gap-1 w-fit px-2 py-0.5 rounded-full bg-green-50 border border-green-200 text-green-700 text-[10px] font-bold tracking-widest uppercase'>
                                <Tag className='w-3 h-3' />
                                {item?.category}
                              </span>
                              <h2 className='font-bold text-gray-800 text-sm leading-tight line-clamp-2'>
                                {item?.name}
                              </h2>
                            </div>
                          </div>

                          {/* Divider */}
                          <div className='border-t border-dashed border-gray-100' />

                          {/* Details */}
                          <div className='flex flex-col gap-2'>
                            <div className='flex items-center gap-2'>
                              <DollarSign className='w-4 h-4 text-gray-400 shrink-0' />
                              <p className='text-sm font-extrabold text-green-700'>
                                ${item?.price}
                                <span className='text-xs font-medium text-gray-400 ml-1'>/ {item?.unit || '—'}</span>
                              </p>
                            </div>
                            <div className='flex items-center gap-2'>
                              <Package className='w-4 h-4 text-gray-400 shrink-0' />
                              <p className='text-xs text-gray-500'>Unit: <span className='font-semibold text-gray-700'>{item?.unit || '—'}</span></p>
                            </div>
                          </div>
                        </div>

                        {/* Footer actions */}
                        <div className='px-4 py-3 bg-gray-50 border-t border-gray-100 flex flex-row items-center justify-between gap-2'>
                          <span className='text-xs text-gray-400 font-mono'>#{item?._id?.toString().slice(-6)}</span>
                          <div className='flex items-center gap-2'>
                            <motion.button
                              whileTap={{ scale: 0.95 }}
                              whileHover={{ scale: 1.08 }}
                              className='bg-green-600 hover:bg-green-700 text-white rounded-lg p-1.5 transition-all cursor-pointer'
                              onClick={() => { setEdit(true); setEditItem(item) }}
                            >
                              <Edit className='w-4 h-4' />
                            </motion.button>
                            <motion.button
                              whileTap={{ scale: 0.95 }}
                              whileHover={{ scale: 1.08 }}
                              onClick={() => handleDelete(item?._id?.toString() || '')}
                              className='bg-red-500 hover:bg-red-600 text-white rounded-lg p-1.5 transition-all cursor-pointer'
                            >
                              <Trash2 className='w-4 h-4' />
                            </motion.button>
                          </div>
                        </div>
                      </motion.div>
                    )
                  })}
                </div>

                {/* Total items */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4 }}
                  className='w-full flex flex-row items-center gap-2 ml-2 pb-20'
                >
                  <span className='text-sm text-gray-400 font-semibold'>
                    Page <span className='text-green-700 font-extrabold'>{currentPage}</span> · <span className='text-green-700 font-extrabold'>{totalItems}</span> items total
                  </span>
                </motion.div>
              </>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className='w-full flex flex-col items-center justify-center py-20 gap-3'
              >
                <Box className='w-14 h-14 text-gray-300' />
                <p className='text-base md:text-lg font-bold text-gray-400'>No grocery items found</p>
              </motion.div>
            )}
          </motion.div>

          {/* Pagination */}
          {totalItems > 0 && (
            <Pagination totalPages={totalPages} handlePrevPage={handlePrevPage} handleNextPage={handleNextPage} currentPage={currentPage} setCurrentPage={setCurrentPage} />
          )}

          {/* Edit Grocery */}
          <AnimatePresence mode='wait' onExitComplete={() => setEdit(false)}>
            {isEdit && (
              <FormEditGrocery isEdit={isEdit} title="Edit Grocery" description="Edit a grocery item in your store." setEdit={setEdit} editItem={editItem} fetchGrocery={fetchGrocery} />
            )}
          </AnimatePresence>

          {/*Popup image*/}
          <AnimatePresence mode='popLayout'>
            {open && editItem?.image?.[0] && (
              <PopupImage image={editItem?.image?.[0] || ''} setOpen={setOpen} />
            )}
          </AnimatePresence>
        </>
      )}
    </>
  )
}

export default ViewGrocery