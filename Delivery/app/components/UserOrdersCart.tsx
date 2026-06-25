'use client'
import { AnimatePresence, motion } from 'framer-motion'
import { AlertTriangle, Box, CardSim, CheckCircle, ChevronDown, ChevronUp, Loader2, LocationEdit, Package, Phone, RefreshCw, TicketCheck, Truck, User, X, XCircle } from 'lucide-react'
import Image from 'next/image'
import { useEffect, useState } from 'react'
import PopupImage from '../HOC/PopupImage'
import { getSocket } from '../lib/socket'
import { useRouter } from 'next/navigation'
import axios from 'axios'
import { useToast } from './Toast'
import { IOrder } from '../models/orders.model'
import { addToCart, clearCart } from '../redux/cartSlice'
import { useDispatch } from 'react-redux'
import { AppDispatch } from '../redux/store'
import { IGrocery } from '../models/grocery.model'

interface UserOrderProps {
    orders: IOrder
}

const UserOrdersCart = ({ orders }: UserOrderProps) => {
    const [expand, setExpand] = useState(false)
    const [isOpenImage, setOpenImage] = useState(false)
    const [status, setStatus] = useState<string>(orders?.status || '')
    const router = useRouter()
    const [showConfirmCancel, setShowConfirmCancel] = useState(false)
    const [reorderLoading, setReorderLoading] = useState(false)
    const [reorderModal, setReorderModal] = useState<{
        available: any[]
        unavailable: { name: string; reason: string }[]
    } | null>(null)
    const { showToast } = useToast()

    const dispatch = useDispatch<AppDispatch>()

    const handleCancel = async (orderId: string) => {
        try {
            await axios.delete(`/api/auth/user/cancel-order`, { data: { orderId } })
            setShowConfirmCancel(false)
            showToast('Order cancelled successfully', 'success')
        } catch (error: any) {
            showToast(error?.response?.data?.message || 'Order cancellation failed', 'error')
        }
    }

    const handleReorder = async () => {
        setReorderLoading(true)
        try {
            const items = orders?.items?.map(item => ({
                groceryId: item?.grocery?.toString(),
                quantity: Number(item?.quantity),
                name: item?.name,
            }))
            const res = await axios.post('/api/auth/user/reorder', { items })
            const { available, unavailable } = res.data
            console.log({available, unavailable})

            if (available.length === 0) {
                showToast('All items are no longer available', 'error')
                return
            }

            if (unavailable.length === 0) {
                // Tất cả available — add to cart và redirect ngay
                dispatch(clearCart())
                available.forEach((item: IGrocery) => dispatch(addToCart({ ...item, quantity: item.quantity })))
                showToast('Items added to cart!', 'success')
                router.push('/user/cart')
                return
            }

            // Có items unavailable — hiện modal confirm
            setReorderModal({ available, unavailable })

        } catch (error: any) {
            showToast(error?.response?.data?.message || 'Reorder failed', 'error')
        } finally {
            setReorderLoading(false)
        }
    }

    const handleConfirmPartialReorder = () => {
        if (!reorderModal) return
        dispatch(clearCart())
        reorderModal.available.forEach((item: IGrocery) => dispatch(addToCart({ ...item, quantity: item.quantity })))
        setReorderModal(null)
        showToast('Available items added to cart!', 'success')
        router.push('/user/cart')
    }

    useEffect(() => {
        const socket = getSocket()

        const handleStatusUpdate = (data: any) => {
            if (data?.orderId?.toString() === orders?._id.toString()) {
                setStatus((prev) => prev === data?.status ? prev : data?.status)
            }
        }
        socket?.on('order-status-updated', handleStatusUpdate)

        return () => {
            socket?.off('order-status-updated', handleStatusUpdate)
        }

    }, [orders?._id])


    return (
        <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className='w-full rounded-2xl border border-gray-100 shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col bg-white mt-6'
        >
            {/* Top accent bar — color by status */}
            <div className={`h-1 w-full ${status === 'Delivered' ? 'bg-linear-to-r from-green-400 to-green-600' : status === 'Out of delivery' ? 'bg-linear-to-r from-yellow-400 to-orange-400' : 'bg-linear-to-r from-gray-300 to-gray-400'}`} />

            {/* Header */}
            <div className='p-4 flex flex-row justify-between items-start gap-3 border-b border-dashed border-gray-100'>
                <div className='flex flex-col gap-1'>
                    <h2 className='font-bold text-gray-800 text-sm md:text-base'>
                        Order <span className='text-green-700 font-mono'>#{orders?._id.toString().slice(-6)}</span>
                    </h2>
                    <p className='text-[11px] text-gray-400'>{new Date(orders?.createdAt!).toLocaleString()}</p>
                </div>

                <div className='flex flex-row items-center gap-2 flex-wrap justify-end'>
                    {status !== 'Delivered' && (
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border ${orders?.isPaid ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-600 border-red-200'}`}>
                            {orders?.isPaid ? 'Paid' : 'Unpaid'}
                        </span>
                    )}
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border ${status === 'Delivered' ? 'bg-green-50 text-green-700 border-green-200' : status === 'Out of delivery' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' : 'bg-gray-50 text-gray-600 border-gray-200'}`}>
                        {status}
                    </span>
                </div>
            </div>

            {/* Body */}
            <div className='p-4 flex flex-col gap-3 flex-1'>
                {/* Order info */}
                <div className='flex flex-col gap-2'>
                    <div className='flex items-center gap-2'>
                        <CardSim className='w-4 h-4 text-gray-400 shrink-0' />
                        <span className='text-sm text-gray-700'>{orders?.paymentMethod === 'online' ? 'Online Payment' : 'Cash on Delivery'}</span>
                    </div>
                    <div className='flex items-start gap-2'>
                        <LocationEdit className='w-4 h-4 text-gray-400 shrink-0 mt-0.5' />
                        <span className='text-sm text-gray-700 leading-relaxed'>{orders?.address?.fullAddress}</span>
                    </div>
                </div>

                {/* Assigned delivery boy */}
                {orders?.assignedDeliveryBoy && (
                    <>
                        <div className='border-t border-dashed border-gray-100' />
                        <div className='flex flex-row items-center justify-between gap-2 bg-blue-50 border border-blue-200 rounded-xl p-3'>
                            <div className='flex items-center gap-2'>
                                <div className='w-8 h-8 rounded-full bg-blue-100 border border-blue-200 flex items-center justify-center shrink-0'>
                                    <User className='w-4 h-4 text-blue-500' />
                                </div>
                                <div className='flex flex-col gap-0.5'>
                                    <span className='text-xs font-semibold text-gray-700'>{orders?.assignedDeliveryBoy?.name}</span>
                                    <span className='text-xs text-gray-500'>{orders?.assignedDeliveryBoy?.mobile}</span>
                                </div>
                            </div>
                            <a
                                href={`tel:${orders?.assignedDeliveryBoy?.mobile}`}
                                className='bg-blue-100 hover:bg-blue-500 text-blue-500 hover:text-white rounded-lg p-1.5 transition-all duration-200 border border-blue-200 hover:border-transparent'
                            >
                                <Phone className='w-4 h-4' />
                            </a>
                        </div>
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.97 }}
                            onClick={() => router.push(`/user/track-order/${orders?._id.toString()}`)}
                            className='flex flex-row justify-center items-center gap-2 bg-green-600 hover:bg-green-700 text-white rounded-xl px-4 py-2.5 shadow-sm transition-all duration-200 w-full cursor-pointer text-sm font-semibold'
                        >
                            {status === 'Delivered' ? (
                                <>
                                    <motion.span
                                        initial={{ opacity: 0, scale: 0.2 }}
                                        animate={{ opacity: [0.3, 0, 0.9], scale: [1, 0.5, 1] }}
                                        transition={{ repeat: Infinity, duration: 2, ease: "easeIn" }}
                                        className='inline-block'
                                    >
                                        <CheckCircle className='w-4 h-4' />
                                    </motion.span>
                                    Order Delivered
                                </>
                            ) : (
                                <>
                                    <motion.span
                                        initial={{ x: 0 }}
                                        animate={{ x: [0, 8, 0] }}
                                        transition={{ duration: 1, repeat: Infinity, repeatType: "loop", ease: "easeInOut" }}
                                        className='inline-block'
                                    >
                                        <Truck className='w-4 h-4' />
                                    </motion.span>
                                    Tracking my orders
                                </>
                            )}
                        </motion.button>
                    </>
                )}

                {/* Items accordion */}
                <div className='border-t border-dashed border-gray-100' />
                <div
                    className='flex items-center justify-between cursor-pointer select-none'
                    onClick={() => setExpand(!expand)}
                >
                    <div className='flex items-center gap-2'>
                        <Box className='w-4 h-4 text-green-700' />
                        <span className='font-semibold text-sm text-gray-700'>
                            {expand ? 'Hide items' : `Items (${orders?.items.length})`}
                        </span>
                    </div>
                    {expand
                        ? <ChevronDown className='w-4 h-4 text-gray-400' />
                        : <ChevronUp className='w-4 h-4 text-gray-400' />
                    }
                </div>

                <AnimatePresence mode="wait">
                    {expand && (
                        orders?.items?.map((item, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.3 }}
                                className='flex justify-between items-center gap-3 px-3 py-2.5 bg-gray-50 rounded-xl border border-gray-100'
                            >
                                <div className='flex items-center gap-3'>
                                    {item?.image[0] ? (
                                        <Image
                                            src={item?.image[0]}
                                            width={52}
                                            height={52}
                                            onClick={() => setOpenImage(true)}
                                            alt={item?.name}
                                            className="object-cover w-[52px] h-[52px] rounded-xl border border-gray-200 cursor-pointer hover:scale-105 transition-transform duration-200"
                                        />
                                    ) : (
                                        <div className='w-full h-full flex items-center justify-center bg-gray-100'>
                                            <Package className='w-6 h-6 text-green-400' />
                                        </div>
                                    )}
                                    <AnimatePresence>
                                        {isOpenImage && item?.image[0] && (
                                            <PopupImage image={item?.image[0]} setOpen={setOpenImage} />
                                        )}
                                    </AnimatePresence>
                                    <div>
                                        <h3 className='text-sm font-semibold text-gray-800 leading-tight'>{item?.name}</h3>
                                        <p className='text-xs text-gray-400 mt-0.5'>{item?.quantity} × {item?.unit}</p>
                                    </div>
                                </div>
                                <p className='text-sm font-bold text-green-700 shrink-0'>${item?.price}</p>
                            </motion.div>
                        ))
                    )}
                </AnimatePresence>
            </div>

            {/* Footer */}
            <div className='px-4 py-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between gap-2'>
                <div className='flex items-center gap-1.5'>
                    <Truck className='w-4 h-4 text-green-700' />
                    <span className='text-xs text-gray-500 font-medium'>Delivery</span>

                    {/* Chỉ hiện khi Pending */}
                    {status === 'Pending' && (
                        <motion.button
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setShowConfirmCancel(prev => !prev)}  // mở confirm dialog
                            className='ml-2 px-2.5 py-1 text-xs font-semibold text-red-500 border border-red-200 bg-red-50 hover:bg-red-100 rounded-lg transition-all cursor-pointer'
                        >
                            Cancel
                        </motion.button>
                    )}

                    {/* Re-order button */}
                    {(status === 'Delivered' || status === 'Cancelled') && (
                        <motion.button
                            whileTap={{ scale: 0.95 }}
                            disabled={reorderLoading}
                            onClick={handleReorder}
                            className='ml-2 px-2.5 py-1 text-xs font-semibold text-white border border-green-500 bg-green-500 hover:bg-green-700 rounded-lg transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-1'
                        >
                            {reorderLoading
                                ? <Loader2 className='w-3.5 h-3.5 animate-spin' />
                                : <RefreshCw className='w-3.5 h-3.5' />}
                            Reorder
                        </motion.button>
                    )}
                </div>
                <p className='font-extrabold text-sm md:text-base text-gray-800'>
                    Total: <span className='text-green-700'>${orders?.totalAmount}</span>
                </p>
            </div>

            {/* Reorder partial modal */}
            <AnimatePresence>
                {reorderModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className='fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center px-4'
                        onClick={() => setReorderModal(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.92, opacity: 0, y: 16 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.92, opacity: 0, y: 16 }}
                            transition={{ duration: 0.25, ease: 'easeOut' }}
                            onClick={e => e.stopPropagation()}
                            className='bg-white rounded-2xl shadow-2xl p-5 w-full max-w-sm'
                        >
                            <div className='flex items-center gap-2 mb-3'>
                                <div className='w-8 h-8 rounded-xl bg-amber-50 flex items-center justify-center shrink-0'>
                                    <AlertTriangle className='w-4 h-4 text-amber-500' />
                                </div>
                                <h2 className='font-bold text-gray-800 text-sm'>Some items unavailable</h2>
                            </div>

                            <div className='flex flex-col gap-1.5 mb-4 max-h-48 overflow-y-auto'>
                                {reorderModal.available.map((item, i) => (
                                    <div key={i} className='flex items-center gap-2 px-3 py-2 bg-green-50 rounded-xl border border-green-100'>
                                        <CheckCircle className='w-3.5 h-3.5 text-green-500 shrink-0' />
                                        <span className='text-xs text-gray-700 font-medium truncate'>{item.name}</span>
                                        <span className='text-xs text-gray-400 ml-auto shrink-0'>×{item.quantity}</span>
                                    </div>
                                ))}
                                {reorderModal.unavailable.map((item, i) => (
                                    <div key={i} className='flex items-center gap-2 px-3 py-2 bg-red-50 rounded-xl border border-red-100'>
                                        <XCircle className='w-3.5 h-3.5 text-red-400 shrink-0' />
                                        <span className='text-xs text-gray-500 truncate line-through'>{item.name}</span>
                                        <span className='text-xs text-red-400 ml-auto shrink-0 whitespace-nowrap'>{item.reason}</span>
                                    </div>
                                ))}
                            </div>

                            <div className='flex gap-2'>
                                <motion.button
                                    whileTap={{ scale: 0.96 }}
                                    onClick={() => setReorderModal(null)}
                                    className='flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 cursor-pointer hover:bg-gray-50 transition-all'
                                >
                                    Cancel
                                </motion.button>
                                <motion.button
                                    whileTap={{ scale: 0.96 }}
                                    onClick={handleConfirmPartialReorder}
                                    className='flex-1 py-2.5 rounded-xl bg-green-600 hover:bg-green-700 text-white text-sm font-semibold cursor-pointer transition-all'
                                >
                                    Add available ({reorderModal.available.length})
                                </motion.button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Cancel order modal */}
            {showConfirmCancel && (
                <AnimatePresence mode="wait">
                    <motion.div
                        key="cancel-order"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="relative max-w-[90vw] max-h-[90vh] cursor-pointer overflow-hidden"
                    >
                        <div className='font-bold text-gray-800 text-center py-2 flex flex-row gap-2 items-center justify-center'>
                            <Box className='w-4 h-4 text-green-500' />
                            Cancel this order?
                        </div>
                        <div className='flex gap-3 w-full'>
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.97 }}
                                onClick={() => setShowConfirmCancel(false)}
                                className='flex-1 py-2 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 cursor-pointer flex items-center justify-center gap-2 bg-red-300'>
                                <XCircle className='w-4 h-4 text-red-500' /> Keep Order
                            </motion.button >
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.97 }} onClick={() => handleCancel(orders?._id?.toString())}
                                className='flex-1 py-2 rounded-xl bg-green-500 text-white text-sm font-semibold cursor-pointer flex items-center justify-center gap-2'>
                                <CheckCircle className='w-4 h-4 text-green-300' /> Yes, Cancel
                            </motion.button>
                        </div>
                    </motion.div>
                </AnimatePresence>
            )}
        </motion.div>
    )
}

export default UserOrdersCart