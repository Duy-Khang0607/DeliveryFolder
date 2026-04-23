'use client'

import { IOrder } from "@/app/models/orders.model"
import axios from "axios"
import { useEffect, useState } from "react"
import { Box, Boxes, Loader2 } from 'lucide-react'
import { motion } from 'framer-motion'
import AdminOrdersCart from "@/app/components/AdminOrdersCart"
import { getSocket } from "@/app/lib/socket"
import ButtonHome from "@/app/components/ButtonHome"
import { useToast } from "@/app/components/Toast"


const ManageOrders = () => {
    const [orders, setOrders] = useState<IOrder[]>([])
    const [loading, setLoading] = useState(false)
    const [loadingFilter, setLoadingFilter] = useState(false)
    const [status, setStatus] = useState<string>('')
    const { showToast } = useToast()

    const fetchOrder = async () => {
        setLoading(true)
        try {
            const res = await axios.get('/api/auth/admin/get-orders')
            setOrders(res?.data)
            setLoading(false)
        } catch (error) {
            console.error({ error })
            setLoading(false)
        } finally {
            setLoading(false)
        }
    }

    const handleFilter = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setLoadingFilter(true)
        setStatus(e?.target?.value)
        setLoadingFilter(false)
    }

    useEffect(() => {
        fetchOrder()
    }, [])

    useEffect(() => {
        const socket = getSocket()

        const handleNewOrder = (newOrder: any) => {
            setOrders((prev) => [newOrder, ...prev!])
        }

        const handleOrderAssigned = (data: any) => {
            const { orderId, assignmentDeliveryBoy, status } = data
            setOrders((prevOrders) => {
                if (!prevOrders) return prevOrders
                return prevOrders?.map((order: IOrder) =>
                    order?._id?.toString() === orderId?.toString()
                        ? { ...order, assignedDeliveryBoy: assignmentDeliveryBoy, status: status || 'Out of delivery' }
                        : order
                )
            })
        }

        const handleOrderStatusUpdated = (data: any) => {
            const { orderId, status, assignedDeliveryBoy } = data
            setOrders((prevOrders) => {
                if (!prevOrders) return prevOrders
                return prevOrders?.map((order: IOrder) =>
                    order?._id?.toString() === orderId?.toString()
                        ? { ...order, status: status, assignedDeliveryBoy: assignedDeliveryBoy }
                        : order
                )
            })
        }

        const handleAllRejected = (data: any) => {
            if (data) showToast(data?.message, 'warning')
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
    }, [])

    console.log({ orders })

    return (
        <section className='w-[90%] sm:w-[85%] md:w-[80%] mx-auto py-5 relative'>
            {/* Loading */}
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
                // Manager Orders
                <div className='max-w-3xl mx-auto w-full h-full relative pt-20 pb-24 space-y-5'>
                    {/* Back && My orders */}
                    <div className='w-full bg-white/70 fixed top-0 left-0 backdrop-blur-xl shadow-md border-b border-gray-300'>
                        <div className='max-w-3xl mx-auto flex flex-row items-center gap-3 py-3'>
                            <ButtonHome />

                            <motion.h1 className='font-bold text-lg md:text-2xl'>
                                Manager Orders
                            </motion.h1>

                            {orders?.length > 0 && (
                                <motion.h2
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.4 }}
                                    className='text-green-700 text-sm md:text-base font-semibold bg-green-100 rounded-full h-5 w-5 flex items-center justify-center p-4'>
                                    {(orders?.filter?.((order: IOrder) => !status || order?.status === status)?.length) || 0}
                                </motion.h2>
                            )}
                        </div>
                    </div>

                    {/* Filter orders status */}
                    {orders?.length > 0 && (
                        <div className="w-full flex justify-end h-full">
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
                        </div>)}

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
                                    <AdminOrdersCart key={index} orders={item as unknown as any} />
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
        </section>
    )
}

export default ManageOrders