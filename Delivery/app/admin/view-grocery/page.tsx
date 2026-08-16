'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { IGrocery } from '@/app/models/grocery.model'
import { useEffect, useState } from 'react'
import axios from 'axios'
import { AlertTriangle, Box, DollarSign, Edit, Loader2, Minus, Package, Plus, Tag, Trash2, Warehouse } from 'lucide-react'
import Image from 'next/image'
import FormEditGrocery from '@/app/components/FormEditGrocery'
import ButtonHome from '@/app/components/ButtonHome'
import { useToast } from '@/app/components/Toast'
import PopupImage from '@/app/HOC/PopupImage'
import Link from 'next/link'
import Pagination from '@/app/components/Pagination'
import { useGroceryPaginatedAdmin } from '@/app/hooks/useGroceryPaginated'
import { useQueryClient } from '@tanstack/react-query'
import SearchInput from '@/app/components/SearchInput'
import { formatVnd } from '@/app/lib/currency'

const ViewGrocery = () => {
  // Edit grocery
  const [isEdit, setEdit] = useState<boolean>(false)
  const [editItem, setEditItem] = useState<IGrocery | null>(null)

  // Toast - custom hook
  const { showToast } = useToast();

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);

  // Popup image
  const [open, setOpen] = useState(false)

  // Search
  const [debouncedSearch, setDebouncedSearch] = useState('')

  // Tanstack query
  const queryClient = useQueryClient()
  const { data, isLoading, isFetching } = useGroceryPaginatedAdmin(currentPage, debouncedSearch)
  const groceries = data?.groceries as IGrocery[] ?? []
  const totalPages = data?.pagination?.totalPages ?? 1
  const totalItems = data?.pagination?.totalItems ?? 0

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

  // Stock inline state: { [groceryId]: currentStock }
  const [stockMap, setStockMap] = useState<Record<string, number>>({})
  const [stockLoading, setStockLoading] = useState<Record<string, boolean>>({})

  const getStock = (item: IGrocery) =>
    stockMap[item._id.toString()] ?? item.stock ?? 0

  const handleStockChange = async (item: IGrocery, delta: number) => {
    const id = item._id.toString()
    const current = getStock(item)
    const next = Math.max(0, current + delta)
    setStockMap(prev => ({ ...prev, [id]: next }))
    setStockLoading(prev => ({ ...prev, [id]: true }))
    try {
      await axios.patch(`/api/auth/admin/update-stock/${id}`, { stock: next })

      // Đồng bộ luôn vào cache groceries
      queryClient.setQueryData(
        ['grocery', 'pagination', currentPage, debouncedSearch],  // ← khớp đúng 4 phần tử
        (old: any) => {
          if (!old) return old   // guard nếu cache chưa tồn tại
          return {
            ...old,
            groceries: old.groceries.map((g: IGrocery) =>
              g._id.toString() === id ? { ...g, stock: next } : g
            )
          }
        }
      )

    } catch {
      setStockMap(prev => ({ ...prev, [id]: current }))
      showToast('Failed to update stock', 'error')
    } finally {
      setStockLoading(prev => ({ ...prev, [id]: false }))
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this grocery?')) return
    try {
      const res = await axios.delete(`/api/auth/admin/delete-grocery`, { data: { id: id } })
      if (res?.data?.success) {
        showToast(res?.data?.message, "success");
        queryClient.invalidateQueries({ queryKey: ['grocery'] })
      } else {
        showToast(res?.data?.message, "error");
      }
    } catch (error) {
      showToast('System error', "error");
    }
  }

  useEffect(() => {
    setCurrentPage(1)
  }, [debouncedSearch])

  return (
    <>
      {isLoading ? (
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

              {/* View Grocery button/link, beautiful and clear on the right */}
              <div>
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
            <SearchInput onSearch={setDebouncedSearch} placeholder='Search for a grocery' />

            {/* Grocery items */}
            {groceries?.length > 0 ? (
              isFetching ? (
                // Loading search
                <div className='w-full flex justify-center items-center py-20'>
                  <Loader2 className='w-15 h-15 md:w-20 md:h-20 animate-spin text-green-700' />
                </div>
              ) : (
                <>
                  {/* Items list */}
                  <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 py-5 w-full'>
                    {groceries?.map((item: IGrocery, index: number) => {
                      return (
                        <motion.div
                          key={item?._id?.toString() || index}
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
                                {item?.image?.[0] ? (
                                  <Image
                                    src={item.image[0]}
                                    alt={item?.name}
                                    fill
                                    className='object-cover group-hover:scale-110 transition-transform duration-300'
                                  />
                                ) : (
                                  <div className='w-full h-full flex items-center justify-center bg-gray-100'>
                                    <Package className='w-6 h-6 text-green-400' />
                                  </div>
                                )}
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

                            {/* Price + Unit */}
                            <div className='flex items-center justify-between gap-2'>
                              <div className='flex items-center gap-1.5'>
                                <DollarSign className='w-4 h-4 text-gray-400 shrink-0' />
                                <p className='text-sm font-extrabold text-green-700'>
                                  {formatVnd(Number(item?.price ?? 0))}
                                  <span className='text-xs font-medium text-gray-400 ml-1'>/ {item?.unit || '—'}</span>
                                </p>
                              </div>
                            </div>

                            {/* ── Stock section ── */}
                            {(() => {
                              const stock = getStock(item)
                              const isLoading = stockLoading[item._id.toString()]
                              const isOut = stock === 0
                              const isLow = stock > 0 && stock <= 10
                              const MAX_DISPLAY = 100

                              const badgeClass = isOut
                                ? 'bg-red-50 text-red-600 border-red-200'
                                : isLow
                                  ? 'bg-amber-50 text-amber-600 border-amber-200'
                                  : 'bg-green-50 text-green-700 border-green-200'

                              const barColor = isOut
                                ? 'bg-red-400'
                                : isLow
                                  ? 'bg-amber-400'
                                  : 'bg-green-500'

                              const barWidth = `${Math.min((stock / MAX_DISPLAY) * 100, 100)}%`

                              return (
                                <div className='flex flex-col gap-2 pt-1'>
                                  {/* Badge + label */}
                                  <div className='flex items-center justify-between'>
                                    <div className='flex items-center gap-1.5'>
                                      <Warehouse className='w-3.5 h-3.5 text-gray-400' />
                                      <span className='text-xs text-gray-500 font-medium'>Stock</span>
                                    </div>
                                    <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${badgeClass}`}>
                                      {isOut && <AlertTriangle className='w-3 h-3' />}
                                      {isOut ? 'Out of Stock' : isLow ? `Low · ${stock}` : `In Stock · ${stock}`}
                                    </span>
                                  </div>

                                  {/* Progress bar */}
                                  <div className='h-1.5 w-full bg-gray-100 rounded-full overflow-hidden'>
                                    <motion.div
                                      className={`h-full rounded-full ${barColor}`}
                                      initial={{ width: 0 }}
                                      animate={{ width: barWidth }}
                                      transition={{ duration: 0.4, ease: 'easeOut' }}
                                    />
                                  </div>

                                  {/* Quick +/- controls */}
                                  <div className='flex items-center justify-between gap-2'>
                                    <span className='text-[11px] text-gray-400'>Quick adjust</span>
                                    <div className='flex items-center gap-1'>
                                      {[-10, -1].map(delta => (
                                        <motion.button
                                          key={delta}
                                          whileTap={{ scale: 0.9 }}
                                          disabled={isLoading || stock + delta < 0}
                                          onClick={() => handleStockChange(item, delta)}
                                          className='w-7 h-7 flex items-center justify-center rounded-lg bg-gray-100 hover:bg-red-50 hover:text-red-500 text-gray-500 text-xs font-bold transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed'
                                        >
                                          {delta === -1 ? <Minus className='w-3 h-3' /> : <span>-10</span>}
                                        </motion.button>
                                      ))}

                                      <div className='px-2 min-w-[32px] text-center'>
                                        {isLoading
                                          ? <Loader2 className='w-3.5 h-3.5 animate-spin text-green-600 mx-auto' />
                                          : <span className='text-sm font-extrabold text-gray-800'>{stock}</span>}
                                      </div>

                                      {[1, 10].map(delta => (
                                        <motion.button
                                          key={delta}
                                          whileTap={{ scale: 0.9 }}
                                          disabled={isLoading}
                                          onClick={() => handleStockChange(item, delta)}
                                          className='w-7 h-7 flex items-center justify-center rounded-lg bg-gray-100 hover:bg-green-50 hover:text-green-600 text-gray-500 text-xs font-bold transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed'
                                        >
                                          {delta === 1 ? <Plus className='w-3 h-3' /> : <span>+10</span>}
                                        </motion.button>
                                      ))}
                                    </div>
                                  </div>
                                </div>
                              )
                            })()}
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
              )
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
              <FormEditGrocery isEdit={isEdit} title="Edit Grocery" description="Edit a grocery item in your store." setEdit={setEdit} editItem={editItem}
                fetchGrocery={() => queryClient.invalidateQueries({ queryKey: ['grocery'] })} />
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