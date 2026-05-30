'use client'

import { IOrder } from "@/app/models/orders.model"
// import axios from "axios"
import { useEffect, useState } from "react"
import { ArrowLeft, Box, Boxes, Loader2 } from 'lucide-react'
import { motion } from 'framer-motion'
import AdminOrdersCart from "@/app/components/AdminOrdersCart"
import { getSocket } from "@/app/lib/socket"
import { useToast } from "@/app/components/Toast"
import { useRouter } from "next/navigation"
import Pagination from "@/app/components/Pagination"
import { useOrdersPaginatedAdmin } from "@/app/hooks/useOrdersPaginated"
import { useQueryClient } from "@tanstack/react-query"

const ManageOrders = () => {
    const [status, setStatus] = useState<string>('')
    const { showToast } = useToast()
    const [currentPage, setCurrentPage] = useState(1);
    const router = useRouter()

    // Tanstack query
    const queryClient = useQueryClient()
    const { data, isLoading, isFetching } = useOrdersPaginatedAdmin(currentPage, status)

    // Lấy từ data thay vì state
    const orders = data?.orders ?? []
    const totalPages = data?.pagination?.totalPages ?? 1
    const totalItems = data?.pagination?.totalItems ?? 0

    const handleFilter = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setStatus(e?.target?.value)
        setCurrentPage(1)
    }

    const handleStatusChange = async (orderId: string, newStatus: string) => {
        // Update cache trực tiếp thay vì setOrders
        queryClient.setQueryData(
            ['orders', 'pagination', currentPage],
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
        const handleOrderStatusUpdated = () => {
            queryClient.invalidateQueries({ queryKey: ['orders', 'pagination'] })
        }
        const handleAllRejected = (data: any) => {
            if (data) showToast(data?.message, 'warning')
            queryClient.invalidateQueries({ queryKey: ['orders', 'pagination'] })
        }

        socket?.on('new-order', handleNewOrder)
        socket?.on('order-assigned', handleOrderAssigned)
        socket?.on('order-status-updated', handleOrderStatusUpdated)
        socket?.on('all-rejected', handleAllRejected)

        return () => {
            socket?.off('new-order', handleNewOrder)
            socket?.off('order-assigned', handleOrderAssigned)
            socket?.off('order-status-updated', handleOrderStatusUpdated)
            socket?.off('all-rejected', handleAllRejected)
        }
    }, [queryClient]) // thêm queryClient vào dependency

    return (
        <section className='w-[90%] sm:w-[85%] md:w-[80%] mx-auto py-5 relative'>
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
                <div className='max-w-3xl mx-auto w-full h-full relative pt-20 pb-24 space-y-5'>
                    {/* Back && My orders */}
                    <div className='w-full bg-white/70 fixed top-0 left-0 backdrop-blur-xl shadow-md border-b border-gray-300 z-9'>
                        <div className='max-w-3xl mx-auto flex flex-row items-center justify-between py-4 h-full gap-5 px-2 md:px-0'>
                            {/* Back to home and My orders */}
                            <div className='w-full flex flex-row items-center gap-2'>
                                <motion.button onClick={() => router.push('/')} whileTap={{ scale: 0.97 }} whileHover={{ scale: 1.06 }} className='bg-white shadow-2xl w-auto rounded-xl text-green-700 text-center flex flex-row gap-2 p-1.5 hover:bg-green-200 cursor-pointer transition-all duration-200 items-center'>
                                    <ArrowLeft className='w-5 h-5' />
                                    <span className='hidden md:flex font-semibold tracking-wide'>Back to home</span>
                                </motion.button>

                                <motion.h1 className='font-bold text-lg md:text-2xl'>
                                    Manage Orders
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
                                        disabled={isLoading}
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
                                    {isLoading && (
                                        <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-70 rounded-2xl z-10">
                                            {/* <Loader2 className="animate-spin text-green-700 w-5 h-5" /> */}
                                            {isFetching && !isLoading && (
                                                <Loader2 className="animate-spin w-4 h-4 text-green-700" />
                                            )}
                                        </div>
                                    )}
                                </div>
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
                            if (orders?.length > 0) {
                                return orders?.map((item: IOrder, index: number) => (
                                    <AdminOrdersCart key={index} orders={item as unknown as any} handleStatusChange={handleStatusChange} />
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