'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { IGrocery } from '@/app/models/grocery.model'
import { useEffect, useState } from 'react'
import axios from 'axios'
import { ArrowLeft, ArrowRight, Box, Edit, Plus, Search, Trash2 } from 'lucide-react'
import Image from 'next/image'
import FormEditGrocery from '@/app/components/FormEditGrocery'
import ButtonHome from '@/app/components/ButtonHome'
import { useToast } from '@/app/components/Toast'
import PopupImage from '@/app/HOC/PopupImage'
import Link from 'next/link'

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
        setCurrentPage(res?.data?.pagination?.currentPage)
        setTotalPages(res?.data?.pagination?.totalPages)
        setTotalItems(res?.data?.pagination?.totalItems || 0)
      }
      setLoading(false)
    } catch (error) {
      console.error({ error })
      setLoading(false)
    } finally {
      setLoading(false)
    }
  }

  const handlePrevPage = () => {
    if (currentPage > 1) {
      fetchGrocery(currentPage - 1)
    }
  }

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      fetchGrocery(currentPage + 1)
    }
  }

  useEffect(() => {
    fetchGrocery(currentPage)
  }, [itemsPerPage, currentPage])

  const handleSearchGrocery = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const value = search.toLowerCase()

    setFilter(groceries?.filter((item: IGrocery) => item?.name?.toLowerCase()?.includes(value) || item?.category?.toLowerCase()?.includes(value)))
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this grocery?')) return
    try {
      const res = await axios.delete(`/api/auth/admin/delete-grocery`, { data: { id: id } })
      console.log({ res })
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
                <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 gap-4 py-5 w-full'>
                  {filter?.map((item: IGrocery, index: number) => {
                    return (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4 }}
                        className='w-full h-full flex flex-row justify-between items-center px-4 py-5 rounded-2xl shadow-xl border border-gray-200 bg-white gap-4 hover:shadow-2xl transition-all duration-200 cursor-pointer'
                      >
                        <div className='flex flex-row items-center gap-4 w-full'>
                          <Image onClick={() => {
                            setOpen(true)
                            setEditItem(item)
                          }} src={item?.image[0]} alt={item?.name} width={100} height={100} className='w-20 h-[100px] object-cover rounded-xl border border-gray-300 shadow-md shadow-gray-300 cursor-pointer' />

                          <div className='flex flex-col items-start gap-2 flex-nowrap w-full'>
                            <h2 className='text-sm md:text-md xl:text-lg font-extrabold text-green-700 text-left'>{item?.name}</h2>
                            <p className='text-sm md:text-base text-gray-500'>{item?.category}</p>
                            <p className='text-sm md:text-xl text-green-700 font-extrabold'>${item?.price} <span className='text-xs md:text-sm text-gray-500'>/{item?.unit}</span></p>
                          </div>
                        </div>

                        <div className='flex flex-row items-center gap-2'>
                          <motion.button
                            whileTap={{ scale: 0.97 }}
                            whileHover={{ scale: 1.06 }}
                            className='bg-green-700 text-white rounded-md p-2 hover:bg-green-800 cursor-pointer transition-all duration-200 w-auto h-auto'
                            onClick={() => {
                              setEdit(true)
                              setEditItem(item)
                            }}
                          >
                            <Edit className='w-5 h-5' />
                          </motion.button>
                          <motion.button
                            whileTap={{ scale: 0.97 }}
                            whileHover={{ scale: 1.06 }}
                            onClick={() => handleDelete(item?._id?.toString() || '')}
                            className='bg-red-500 text-white rounded-md p-2 hover:bg-red-800 cursor-pointer transition-all duration-200 w-auto h-auto'
                          >
                            <Trash2 className='w-5 h-5' />
                          </motion.button>
                        </div>
                      </motion.div>
                    )
                  }
                  )}
                </div>

                {/* Total items */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4 }}
                  className='w-full h-full flex flex-row justify-between items-center gap-2 ml-2'
                >
                  <span className='text-sm md:text-base text-gray-500 font-bold'>Pages of items: {" "}
                    <span className='text-sm md:text-base text-green-700 font-extrabold'>{currentPage} of {totalItems}</span>
                  </span>
                </motion.div>
              </>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className='w-full h-full flex flex-col items-center justify-center'
              >
                <p className='text-lg md:text-2xl font-extrabold text-gray-500'>No groceries items found</p>
              </motion.div>
            )}
          </motion.div>

          {/* Pagination */}
          {totalItems > 0 && (
            <div className='fixed left-1/2 -translate-x-1/2 bottom-2 md:bottom-0 flex flex-row justify-center items-center z-50 bg-white/50 backdrop-blur-sm rounded-full p-2 border border-gray-300'>
              {/* Prev Page */}
              <motion.button
                whileTap={{ scale: 0.97 }}
                whileHover={{ scale: 1.06 }}
                onClick={handlePrevPage}
                disabled={currentPage === 1}
                className={`rounded-full p-2 transition-all duration-200 w-auto h-auto ${currentPage === 1 ? 'bg-gray-500 text-white cursor-not-allowed' : 'bg-green-700 text-white cursor-pointer hover:bg-green-800'}`}
              >
                <ArrowLeft className='w-5 h-5' />
              </motion.button>
              {/* Show pages 1, 2, 3, 4, 5 */}
              {totalPages > 5 ? (
                <>
                  {currentPage !== totalPages && (
                    <>
                      <motion.button
                        key={currentPage}
                        whileTap={{ scale: 0.97 }}
                        whileHover={{ scale: 1.06 }}
                        onClick={() => {
                          if (1 !== currentPage) fetchGrocery(1)
                        }}
                        className={`
                      bg-green-700 text-white rounded-full hover:bg-green-800 hover:text-white cursor-pointer transition-all duration-200 w-8 h-8 font-bold flex justify-center items-center mx-1`}
                      >
                        <span className='text-sm md:text-base w-full text-center'>{currentPage}</span>
                      </motion.button>

                      <span className="mx-1 text-gray-500 text-base font-bold select-none">...</span>
                    </>
                  )}


                  <motion.button
                    key={totalPages}
                    whileTap={{ scale: 0.97 }}
                    whileHover={{ scale: 1.06 }}
                    onClick={() => {
                      if (totalPages !== currentPage) fetchGrocery(totalPages)
                    }}
                    className={`${currentPage === totalPages
                      ? 'bg-green-700 text-white'
                      : 'bg-white text-green-700 border border-green-700'
                      } rounded-full hover:bg-green-800 hover:text-white cursor-pointer transition-all duration-200 w-8 h-8 font-bold flex justify-center items-center mx-1`}
                  >
                    <span className='text-sm md:text-base w-full text-center'>{totalPages}</span>
                  </motion.button>
                </>
              ) : (
                Array.from({ length: totalPages }, (_, i) => {
                  const pageNum = i + 1;
                  return (
                    <motion.button
                      key={pageNum}
                      whileTap={{ scale: 0.97 }}
                      whileHover={{ scale: 1.06 }}
                      onClick={() => {
                        if (pageNum !== currentPage) fetchGrocery(pageNum)
                      }}
                      className={`${pageNum === currentPage
                        ? 'bg-green-700 text-white'
                        : 'bg-white text-green-700 border border-green-700'
                        } rounded-full hover:bg-green-800 hover:text-white cursor-pointer transition-all duration-200 w-8 h-8 font-bold flex justify-center items-center mx-1`}
                    >
                      <span className='text-sm md:text-base w-full text-center'>{pageNum}</span>
                    </motion.button>
                  );
                })
              )}
              {/* Next Page */}
              <motion.button
                whileTap={{ scale: 0.97 }}
                whileHover={{ scale: 1.06 }}
                onClick={handleNextPage}
                disabled={currentPage === totalPages}
                className={`rounded-full p-2 transition-all duration-200 w-auto h-auto ${currentPage === totalPages ? 'bg-gray-500 text-white cursor-not-allowed' : 'bg-green-700 text-white cursor-pointer hover:bg-green-800'}`}
              >
                <ArrowRight className='w-5 h-5' />
              </motion.button>
            </div>
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