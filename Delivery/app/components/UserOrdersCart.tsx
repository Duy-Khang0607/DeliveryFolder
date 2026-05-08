'use client'
import { AnimatePresence, motion } from 'framer-motion'
import { Box, CardSim, CheckCircle, ChevronDown, ChevronUp, LocationEdit, Phone, Truck, User } from 'lucide-react'
import Image from 'next/image'
import { useEffect, useState } from 'react'
import PopupImage from '../HOC/PopupImage'
import { getSocket } from '../lib/socket'
import { IUserClient } from '../types'
import { useRouter } from 'next/navigation'


interface UserOrderProps {
    orders: IOrder
}

interface IOrder {
    _id: string,
    user: string,
    items: [
        {
            grocery: string,
            name: string,
            price: string,
            unit: string,
            image: string[],
            quantity: string,
        }
    ]
    totalAmount: number,
    paymentMethod: 'cod' | 'online',
    address: {
        fullName: string,
        mobile: number,
        city: string,
        state: string,
        pincode: string,
        fullAddress: string,
        latitude: number,
        longitude: number
    },
    status: 'Pending' | 'Out of delivery' | 'Delivered',
    createdAt?: Date,
    updatedAt?: Date,
    isPaid: boolean,
    assignedDeliveryBoy?: IUserClient | null,
    assignment?: string
    deliveredAt?: Date | null,
    deliveryOTP?: string | null,
    deliveryOTPVerification: boolean,
}

const UserOrdersCart = ({ orders }: UserOrderProps) => {
    const [expand, setExpand] = useState(false)
    const [isOpenImage, setOpenImage] = useState(false)
    const [status, setStatus] = useState<string>(orders?.status || '')
    const router = useRouter()

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
                                    <Image
                                        src={item?.image[0]}
                                        width={52}
                                        height={52}
                                        onClick={() => setOpenImage(true)}
                                        alt={item?.name}
                                        className="object-cover w-[52px] h-[52px] rounded-xl border border-gray-200 cursor-pointer hover:scale-105 transition-transform duration-200"
                                    />
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
                </div>
                <p className='font-extrabold text-sm md:text-base text-gray-800'>
                    Total: <span className='text-green-700'>${orders?.totalAmount}</span>
                </p>
            </div>
        </motion.div>
    )
}

export default UserOrdersCart