'use client'

import { IOrder } from "@/app/models/orders.model"
import { useEffect, useState } from "react"
import { ArrowLeft, Box, Boxes, Loader2, Search, X } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import AdminOrdersCart from "@/app/components/AdminOrdersCart"
import { getSocket } from "@/app/lib/socket"
import { useToast } from "@/app/components/Toast"
import { useRouter } from "next/navigation"
import Pagination from "@/app/components/Pagination"
import { useOrdersPaginatedAdmin } from "@/app/hooks/useOrdersPaginated"
import { useQueryClient } from "@tanstack/react-query"
import SearchInput from "@/app/components/SearchInput"

const ManageOrders = () => {
    // Filter by status
    const [status, setStatus] = useState<string>('')

    // Toast - custom hook
    const { showToast } = useToast()

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);

    // Router
    const router = useRouter()

    // Search
    const [debouncedSearch, setDebouncedSearch] = useState('')
    const [showSearch, setShowSearch] = useState(false)

    // Tanstack query
    const { data, isLoading, isFetching } = useOrdersPaginatedAdmin(currentPage, status, debouncedSearch)
    const queryClient = useQueryClient()
    const orders = data?.orders ?? []
    const totalPages = data?.pagination?.totalPages ?? 1
    const totalItems = data?.pagination?.totalItems ?? 0

    const handleStatusChange = async (orderId: string, newStatus: string) => {
        queryClient.setQueryData(
            ['orders', 'pagination', currentPage, status, debouncedSearch],
            (oldData: any) => ({
                ...oldData,
                orders: oldData?.orders?.map((order: IOrder) =>
                    order?._id?.toString() === orderId
                        ? { ...order, status: newStatus as IOrder['status'] }
                        : order
                )
            })
        )
    }

    const handlePaymentChange = (orderId: string, payment: { paymentMethod?: IOrder['paymentMethod']; isPaid?: boolean }) => {
        queryClient.setQueryData(
            ['orders', 'pagination', currentPage, status, debouncedSearch],
            (oldData: any) => ({
                ...oldData,
                orders: oldData?.orders?.map((order: IOrder) =>
                    order?._id?.toString() === orderId
                        ? { ...order, ...payment }
                        : order
                )
            })
        )
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

    useEffect(() => {
        const socket = getSocket()

        const handleNewOrder = () => {
            // Refetch tất cả pages của orders
            queryClient.invalidateQueries({ queryKey: ['orders', 'pagination'] })
        }
        const handleOrderAssigned = () => {
            queryClient.invalidateQueries({ queryKey: ['orders', 'pagination'] })
        }
        const handleOrderStatusUpdated = (data: any) => {
            if (data?.status === 'Cancelled' && data?.orderId) {
                showToast(`Order ${data?.orderId?.toString()?.slice(-6)} cancelled successfully`, 'success')
            }
            queryClient.invalidateQueries({ queryKey: ['orders', 'pagination'] })
        }
        const handleAllRejected = (data: any) => {
            if (data) showToast(data?.message, 'warning')
            queryClient.invalidateQueries({ queryKey: ['orders', 'pagination'] })
        }

        const handleOrderPaymentUpdated = (data: {
            orderId?: string
            paymentMethod?: IOrder['paymentMethod']
            isPaid?: boolean
        }) => {
            console.log({data})
            if (data?.orderId) {
                handlePaymentChange(data.orderId.toString(), {
                    paymentMethod: data.paymentMethod,
                    isPaid: data.isPaid,
                })
            } else {
                queryClient.invalidateQueries({ queryKey: ['orders', 'pagination'] })
            }
        }

        socket?.on('new-order', handleNewOrder)
        socket?.on('order-assigned', handleOrderAssigned)
        socket?.on('order-status-updated', handleOrderStatusUpdated)
        socket?.on('order-payment-updated', handleOrderPaymentUpdated)
        socket?.on('all-rejected', handleAllRejected)

        return () => {
            socket?.off('new-order', handleNewOrder)
            socket?.off('order-assigned', handleOrderAssigned)
            socket?.off('order-status-updated', handleOrderStatusUpdated)
            socket?.off('order-payment-updated', handleOrderPaymentUpdated)
            socket?.off('all-rejected', handleAllRejected)
        }
    }, [queryClient, currentPage, status, debouncedSearch, showToast])

    useEffect(() => {
        setCurrentPage(1)
    }, [debouncedSearch])

    return (
        <section className='w-[90%] sm:w-[85%] md:w-[80%] mx-auto py-14 relative'>
            {/* Loading */}
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
                // Manager Orders
                <div className='max-w-3xl mx-auto w-full h-full relative pt-24 pb-24 space-y-5'>
                    {/* Back to home && Filter by status */}
                    <div className='w-full bg-white/80 fixed top-0 left-0 backdrop-blur-xl border-b border-gray-100 shadow-sm z-50'>
                        <div className='max-w-3xl mx-auto px-4 py-3 space-y-3'>

                            {/* Row 1: Back + Title + Actions */}
                            <div className='flex items-center gap-3'>

                                <motion.button onClick={() => router.push('/')} whileTap={{ scale: 0.97 }} whileHover={{ scale: 1.06 }} className='bg-white shadow-2xl w-auto rounded-xl text-green-700 text-center flex flex-row gap-2 p-1.5 hover:bg-green-200 cursor-pointer transition-all duration-200 items-center'>
                                    <ArrowLeft className='w-5 h-5' />
                                    <span className='hidden xl:flex font-semibold tracking-wide'>Back to home</span>
                                </motion.button>

                                <div className='flex-1 min-w-0'>
                                    <h1 className='font-extrabold text-lg text-gray-800 leading-tight truncate'>Manage Orders</h1>
                                    <p className='text-xs text-gray-400'>{totalItems} Total orders</p>
                                </div>

                                {/* Search full — chỉ hiện trên lg (>1024px) */}
                                <div className='hidden xl:flex flex-1 max-w-xs'>
                                    <SearchInput onSearch={setDebouncedSearch} placeholder='Search for a order' />
                                </div>

                                {/* Search icon button — chỉ hiện trên mobile/tablet (<1024px) */}
                                <motion.button
                                    onClick={() => setShowSearch(prev => !prev)}
                                    whileTap={{ scale: 0.93 }}
                                    className={`xl:hidden p-2 rounded-xl transition-all cursor-pointer shrink-0
                                    ${showSearch
                                            ? 'bg-green-600 text-white'
                                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                        }`}
                                >
                                    {showSearch ? <X className='w-4 h-4' /> : <Search className='w-4 h-4' />}
                                </motion.button>
                            </div>

                            {/* Search collapse — chỉ mobile/tablet, toggle khi click */}
                            <AnimatePresence>
                                {showSearch && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0, y: -8 }}
                                        animate={{ opacity: 1, height: 'auto', y: 0 }}
                                        exit={{ opacity: 0, height: 0, y: -8 }}
                                        transition={{ duration: 0.25, ease: 'easeOut' }}
                                        className='overflow-hidden xl:hidden'
                                    >
                                        <SearchInput onSearch={setDebouncedSearch} placeholder='Search for a order' />
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* Status filter tabs */}
                            <div className='flex gap-2 overflow-x-auto scrollbar-hide pb-0.5'>
                                {[
                                    { label: 'All', value: '', active: 'bg-gray-800 text-white', inactive: 'bg-gray-100 text-gray-500' },
                                    { label: 'Pending', value: 'Pending', active: 'bg-gray-300 text-gray-600 border-gray-500', inactive: 'bg-gray-100 text-gray-600 border-gray-200' },
                                    { label: 'Out of Delivery', value: 'Out of delivery', active: 'bg-yellow-100 text-yellow-700 border-yellow-500', inactive: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
                                    { label: 'Delivered', value: 'Delivered', active: 'bg-green-600 text-white', inactive: 'bg-green-50 text-green-700' },
                                    { label: 'Cancelled', value: 'Cancelled', active: 'bg-red-500 text-white', inactive: 'bg-red-50 text-red-700' }
                                ].map((tab) => (
                                    <motion.button
                                        key={tab.value}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={() => { setStatus(tab.value); setCurrentPage(1) }}
                                        className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-bold transition-all duration-200 cursor-pointer whitespace-nowrap
                        ${status === tab.value ? tab.active : tab.inactive}`}
                                    >
                                        {tab.label}
                                    </motion.button>
                                ))}
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
                        isFetching && orders?.length > 0 ? (
                            <div className='w-full flex justify-center items-center py-20'>
                                <Loader2 className='w-15 h-15 md:w-20 md:h-20 animate-spin text-green-700' />
                            </div>
                        ) : (
                            <div className={isFetching ? 'opacity-50 pointer-events-none transition-opacity' : ''}>
                                {orders?.length > 0 ? (
                                    orders.map((item: IOrder, index: number) => (
                                        <AdminOrdersCart key={item?._id?.toString() || index} orders={item as unknown as any} handleStatusChange={handleStatusChange} />
                                    ))
                                ) : !isFetching ? (
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
                                ) : null}
                            </div>
                        )
                    )}
                </div>
            )}

            {/* Pagination */}
            {totalItems > 0 && (
                <Pagination totalPages={totalPages} handlePrevPage={handlePrevPage} handleNextPage={handleNextPage} currentPage={currentPage} setCurrentPage={setCurrentPage} />
            )}
        </section>
    )
}

export default ManageOrders