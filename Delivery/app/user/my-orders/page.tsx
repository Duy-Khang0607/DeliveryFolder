'use client'
import UserOrdersCart from '@/app/components/UserOrdersCart'
import { getSocket } from '@/app/lib/socket'
import axios from 'axios'
import { motion } from 'framer-motion'
import { ArrowLeft, ArrowRight, Box, Boxes, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { IOrder } from "@/app/models/orders.model"
import { useEffect, useState } from 'react'
import Pagination from '@/app/components/Pagination'

const MyOrders = () => {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [orders, setOrders] = useState<any[]>([])
  const [loadingFilter, setLoadingFilter] = useState(false)
  const [status, setStatus] = useState<string>('')
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const itemsPerPage = 10



  const fetchOrders = async (page: number = 1) => {
    setLoading(true)
    try {
      const res = await axios.get(`/api/auth/user/my-orders?page=${page}&limit=${itemsPerPage}`);
      setOrders(res?.data?.orders)
      setCurrentPage(res?.data?.pagination?.currentPage)
      setTotalPages(res?.data?.pagination?.totalPages)
      setTotalItems(res?.data?.pagination?.totalItems || 0)
    } catch (error: any) {
      console.error({ error: error?.response?.data })
      setLoading(false)
    } finally {
      setLoading(false);
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

  const handleFilter = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setLoadingFilter(true)
    setStatus(e?.target?.value)
    setLoadingFilter(false)
  }

  useEffect(() => {
    const socket = getSocket()

    const handleOrderAssigned = (data: any) => {
      const { orderId, assignmentDeliveryBoy } = data
      setOrders((prevOrders) => {
        if (!prevOrders) return prevOrders
        return prevOrders.map((order) =>
          order?._id.toString() === orderId?.toString()
            ? { ...order, assignedDeliveryBoy: assignmentDeliveryBoy }
            : order
        )
      })
    }

    socket?.on('order-assigned', handleOrderAssigned)
    return () => {
      socket?.off('order-assigned', handleOrderAssigned)
    }
  }, [])

  useEffect(() => {
    fetchOrders(currentPage);
  }, [currentPage]);

  return (
    <section className='w-[90%] sm:w-[85%] md:w-[80%] mx-auto min-h-screen'>
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
        <div
          className='max-w-3xl mx-auto w-full h-full relative pt-20 pb-24 space-y-10'>
          {/* Back && My orders */}
          <div className='w-full bg-white/70 fixed top-0 left-0 backdrop-blur-xl shadow-md border-b border-gray-300 z-9'>
            <div className='max-w-3xl mx-auto flex flex-col md:flex-row md:items-center justify-between py-4 h-full gap-5'>
              {/* Back to home and My orders */}
              <div className='w-full flex flex-row items-center gap-2'>
                <motion.button onClick={() => router.push('/')} whileTap={{ scale: 0.97 }} whileHover={{ scale: 1.06 }} className='bg-white shadow-2xl w-auto rounded-xl text-green-700 text-center flex flex-row gap-2 p-1.5 hover:bg-green-200 cursor-pointer transition-all duration-200 items-center'>
                  <ArrowLeft className='w-5 h-5' />
                  <span className='hidden md:flex font-semibold tracking-wide'>Back to home</span>
                </motion.button>

                <motion.h1 className='font-bold text-lg md:text-2xl'>
                  My Orders
                </motion.h1>

                {orders?.length > 0 && (
                  <>
                    <motion.h2
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4 }}
                      className={`text-sm md:text-base font-semibold rounded-full h-5 w-5 flex items-center justify-center p-4 ${status === 'Delivered' ? 'bg-green-100 text-green-700' : status === 'Out of delivery' ? 'bg-yellow-200 text-yellow-700' : status === 'Pending' ? 'bg-gray-200 text-gray-700' : 'bg-black/80 text-white'}`}>
                      {(orders?.filter?.((order: IOrder) => !status || order?.status === status)?.length) || 0}
                    </motion.h2>/ {totalItems}
                  </>
                )}
              </div>

              {/* Filter orders status */}
              <div className='ml-2 md:mx-auto'>
                {orders?.length > 0 && (
                  <div className="relative">
                    <label
                      htmlFor="order-status-filter"
                      className="absolute left-3 -top-3 bg-white px-1 text-xs font-semibold text-green-700 tracking-wide rounded shadow-sm"
                      style={{ pointerEvents: "none" }}
                    >
                      Filter by Status
                    </label>
                    <select
                      id="order-status-filter"
                      required
                      disabled={loadingFilter}
                      className="px-4 py-2 rounded-2xl border border-green-300 bg-white shadow-md focus:outline-none focus:ring-2 focus:ring-green-500 transition-all duration-300 cursor-pointer font-medium text-green-700 hover:border-green-500"
                      value={status}
                      onChange={handleFilter}
                      style={{ minWidth: "175px" }}
                    >
                      <option value="" >
                        All Status
                      </option>
                      <option value="Pending" >
                        Pending
                      </option>
                      <option value="Out of delivery" >
                        Out of delivery
                      </option>
                      <option value="Delivered" >
                        Delivered
                      </option>
                    </select>
                    {loadingFilter && (
                      <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-70 rounded-2xl z-10">
                        <Loader2 className="animate-spin text-green-700 w-5 h-5" />
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Order cart items empty */}
          {orders?.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className='w-full flex flex-col items-center justify-center'
            >
              <Boxes className='w-15 h-15 md:w-20 md:h-20 text-green-700' />
              <h1 className='text-md md:text-2xl font-bold'>No Orders Found</h1>
              <p className='text-sm max-w-md md:max-w-xl text-gray-500'>Start shopping to view your orders here.</p>
            </motion.div>
          ) : (
            (() => {
              const filteredOrders = orders?.filter?.((order: IOrder) => !status || order?.status === status)
              if (filteredOrders?.length > 0) {
                return filteredOrders?.map((item: IOrder, index: number) => (
                  <UserOrdersCart key={index} orders={item as unknown as any} />
                ))
              }
              return (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4 }}
                  className='w-full flex flex-col items-center justify-center'
                >
                  <Boxes className='w-15 h-15 md:w-20 md:h-20 text-green-700' />
                  <h1 className='text-md md:text-2xl font-bold'>No Orders Found</h1>
                  <p className='text-sm max-w-md md:max-w-xl text-gray-500'>Start shopping to view your orders here.</p>
                </motion.div>
              )
            })()
          )}
        </div >
      )}

      {/* Pagination */}
      {totalItems > 0 && (
        <Pagination totalPages={totalPages} handlePrevPage={handlePrevPage} handleNextPage={handleNextPage} currentPage={currentPage} setCurrentPage={setCurrentPage} />
      )}

    </section >
  )
}

export default MyOrders