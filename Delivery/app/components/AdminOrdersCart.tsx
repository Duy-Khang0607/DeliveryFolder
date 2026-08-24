'use client'
import { AnimatePresence, motion } from 'framer-motion'
import { Box, CardSim, CheckCircle, ChevronDown, ChevronUp, Loader2, LocationEdit, Package, Phone, Truck, User, UserCheck, X } from 'lucide-react'
import Image from 'next/image'
import { useEffect, useState } from 'react'
import PopupImage from '../HOC/PopupImage'
import axios from 'axios'
import { IUserClient } from '../types'
import { useToast } from "@/app/components/Toast"
import { formatVnd } from '@/app/lib/currency'
import { useQuery } from '@tanstack/react-query'


interface AdminOrderProps {
    orders: IOrder
    handleStatusChange: (orderId: string, newStatus: string) => void
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
}


const AdminOrdersCart = ({ orders, handleStatusChange }: AdminOrderProps) => {
    const [expand, setExpand] = useState(false)
    const [isOpenImage, setOpenImage] = useState(false)
    const statusPayment = ['Out of delivery', 'Pending', 'Cancelled']
    const [status, setStatus] = useState<string>('Pending')
    const [isPaid, setIsPaid] = useState(Boolean(orders?.isPaid))
    const [paymentMethod, setPaymentMethod] = useState(orders?.paymentMethod ?? 'cod')
    const [loading, setLoading] = useState(false)
    const [showAssignModal, setShowAssignModal] = useState(false)
    const [assigning, setAssigning] = useState<string | null>(null)
    const { showToast } = useToast()

    // Fetch delivery boys khi modal mở
    const { data: dbData, isLoading: dbLoading } = useQuery({
        queryKey: ['available-delivery-boys'],
        queryFn: () => axios.get('/api/auth/admin/available-delivery-boys').then(r => r.data),
        enabled: showAssignModal,
        staleTime: 30_000,
    })
    const availableDeliveryBoys: any[] = dbData?.deliveryBoys ?? []

    const updateOrderStatus = async (orderId: string, status: string) => {
        setLoading(true)
        try {
            await axios.post(`/api/auth/admin/update-order-status/${orderId}`, { status })
            setStatus(status)
            handleStatusChange?.(orderId, status)
            if (status === 'Out of delivery') {
                showToast('Order is out of delivery', 'success')
            } else {
                showToast('Order is pending !', 'warning')
            }
        } catch (error) {
            setLoading(false)
            showToast('Order status update failed', 'error')
        } finally {
            setLoading(false)
        }
    }

    const handleAssign = async (deliveryBoyId: string) => {
        setAssigning(deliveryBoyId)
        try {
            await axios.post(`/api/auth/admin/assign-delivery-boy/${orders._id}`, { deliveryBoyId })
            setStatus('Out of delivery')
            setShowAssignModal(false)
            handleStatusChange?.(orders._id, 'Out of delivery')
            showToast('Delivery boy assigned successfully!', 'success')
        } catch (err: any) {
            showToast(err?.response?.data?.message || 'Failed to assign', 'error')
        } finally {
            setAssigning(null)
        }
    }

    const styleStatus = status === 'Delivered' ? 'bg-green-50 text-green-700 border-green-200' : status === 'Out of delivery' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' : status === 'Cancelled' ? 'bg-red-50 text-red-600 border-red-200' : 'bg-gray-50 text-gray-600 border-gray-200'

    const styleBg = status === 'Delivered' ? 'bg-linear-to-r from-green-400 to-green-600' : status === 'Out of delivery' ? 'bg-linear-to-r from-yellow-400 to-orange-400' : status === 'Cancelled' ? 'bg-linear-to-r from-red-400 to-red-600' : 'bg-linear-to-r from-gray-300 to-gray-400'

    useEffect(() => {
        setStatus(orders?.status)
    }, [orders?.status])

    useEffect(() => {
        setIsPaid(Boolean(orders?.isPaid))
        setPaymentMethod(orders?.paymentMethod ?? 'cod')
    }, [orders?.isPaid, orders?.paymentMethod])

    return (
        <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className='w-full rounded-2xl border border-gray-100 shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col bg-white mb-7 last:mb-0'
        >
            {/* Top accent bar — color by status */}
            <div className={`h-1 w-full ${styleBg}`} />

            {/* Header */}
            <div className='p-4 flex flex-row justify-between items-start gap-3 border-b border-dashed border-gray-100'>
                <div className='flex flex-col gap-1'>
                    <h2 className='font-bold text-gray-800 text-sm md:text-base'>
                        Order <span className='text-green-700 font-mono'>#{String(orders?._id).slice(-6)}</span>
                    </h2>
                    <p className='text-[11px] text-gray-400'>{new Date(orders?.createdAt!).toLocaleString()}</p>
                </div>

                <div className='flex flex-row items-center gap-2 flex-wrap justify-end'>
                    {status !== 'Delivered' && (
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border ${isPaid ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-600 border-red-200'}`}>
                            {isPaid ? 'Paid' : 'Unpaid'}
                        </span>
                    )}
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold border ${styleStatus}`}>
                        {loading ? <Loader2 className='w-3 h-3 animate-spin' /> : status}
                    </span>
                    {status !== 'Delivered' && status !== 'Cancelled' && (
                        <select
                            required
                            disabled={loading}
                            className='text-xs rounded-lg border border-gray-200 px-2 py-1 focus:outline-none focus:ring-2 focus:ring-green-500 transition-all cursor-pointer bg-white'
                            value={status}
                            onChange={(e) => updateOrderStatus(String(orders?._id), e.target.value)}
                        >
                            <option value='' disabled>Change status</option>
                            {statusPayment?.map((item, index) => (
                                <option key={index} value={item}>{item}</option>
                            ))}
                        </select>
                    )}
                    {status === 'Pending' && (
                        <motion.button
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setShowAssignModal(true)}
                            className='flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-600 border border-blue-200 transition-all cursor-pointer shrink-0'
                        >
                            <UserCheck className='w-3.5 h-3.5' />
                            Assign
                        </motion.button>
                    )}
                </div>
            </div>

            {/* Body */}
            <div className='p-4 flex flex-col gap-3 flex-1'>
                {/* Customer info */}
                <div className='flex flex-col gap-2'>
                    <div className='flex items-center gap-2'>
                        <User className='w-4 h-4 text-gray-400 shrink-0' />
                        <span className='text-sm text-gray-700 font-medium'>{orders?.address?.fullName}</span>
                    </div>
                    <div className='flex items-center gap-2'>
                        <Phone className='w-4 h-4 text-gray-400 shrink-0' />
                        <span className='text-sm text-gray-700'>{orders?.address?.mobile}</span>
                    </div>
                    <div className='flex items-center gap-2'>
                        <CardSim className='w-4 h-4 text-gray-400 shrink-0' />
                        <span className='text-sm text-gray-700'>{paymentMethod === 'online' ? 'Online Payment' : 'Cash on Delivery'}</span>
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
                                    <span className='text-xs font-semibold text-gray-700'>{(orders?.assignedDeliveryBoy as IUserClient)?.name}</span>
                                    <span className='text-xs text-gray-500'>{(orders?.assignedDeliveryBoy as IUserClient)?.mobile}</span>
                                </div>
                            </div>
                            <a
                                href={`tel:${(orders?.assignedDeliveryBoy as IUserClient)?.mobile}`}
                                className='bg-blue-100 hover:bg-blue-500 text-blue-500 hover:text-white rounded-lg p-1.5 transition-all duration-200 border border-blue-200 hover:border-transparent'
                            >
                                <Phone className='w-4 h-4' />
                            </a>
                        </div>
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.97 }}
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
                                <p className='text-sm font-bold text-green-700 shrink-0'>{formatVnd(Number(item?.price ?? 0))}</p>
                            </motion.div>
                        ))
                    )}
                </AnimatePresence>
            </div>

            {/* Footer */}
            <div className='px-4 py-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between gap-2'>
                <div className='flex items-center gap-1.5'>
                    <Truck className='w-4 h-4 text-green-700' />
                    <span className='text-xs text-gray-500 font-medium'>
                        Delivery: <strong className={`${styleStatus}`}>{status}</strong>
                    </span>
                </div>
                <p className='font-extrabold text-sm md:text-base text-gray-800'>
                    Total: <span className='text-green-700'>{formatVnd(Number(orders?.totalAmount ?? 0))}</span>
                </p>
            </div>

            {/* Assign Manually Modal */}
            <AnimatePresence>
                {showAssignModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className='fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center px-4'
                        onClick={() => setShowAssignModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.93, opacity: 0, y: 16 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.93, opacity: 0, y: 16 }}
                            transition={{ duration: 0.25, ease: 'easeOut' }}
                            onClick={e => e.stopPropagation()}
                            className='bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden'
                        >
                            {/* Modal header */}
                            <div className='flex items-center justify-between px-5 py-4 border-b border-gray-100'>
                                <div className='flex items-center gap-2'>
                                    <div className='w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center'>
                                        <UserCheck className='w-4 h-4 text-blue-600' />
                                    </div>
                                    <div>
                                        <h2 className='font-bold text-gray-800 text-sm'>Assign Delivery Boy</h2>
                                        <p className='text-[11px] text-gray-400'>Order #{String(orders._id).slice(-6)}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setShowAssignModal(false)}
                                    className='p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 transition-all cursor-pointer'
                                >
                                    <X className='w-4 h-4' />
                                </button>
                            </div>

                            {/* Delivery boy list */}
                            <div className='max-h-80 overflow-y-auto custom-scrollbar'>
                                {dbLoading ? (
                                    <div className='flex items-center justify-center py-10'>
                                        <Loader2 className='w-6 h-6 animate-spin text-blue-500' />
                                    </div>
                                ) : availableDeliveryBoys.length === 0 ? (
                                    <div className='flex flex-col items-center justify-center py-10 gap-2'>
                                        <Truck className='w-8 h-8 text-gray-300' />
                                        <p className='text-sm text-gray-400'>No delivery boys found</p>
                                    </div>
                                ) : (
                                    <div className='flex flex-col divide-y divide-gray-50'>
                                        {availableDeliveryBoys.map((boy: any) => {
                                            const isAssigningThis = assigning === boy._id.toString()
                                            const canAssign = boy.isOnline && boy.isAvailable

                                            const badgeClass = !boy.isOnline
                                                ? 'bg-gray-100 text-gray-400'
                                                : !boy.isAvailable
                                                    ? 'bg-amber-50 text-amber-600 border border-amber-200'
                                                    : 'bg-green-50 text-green-600 border border-green-200'

                                            const badgeLabel = !boy.isOnline
                                                ? 'Offline'
                                                : !boy.isAvailable
                                                    ? 'Busy'
                                                    : 'Available'

                                            return (
                                                <div
                                                    key={boy._id}
                                                    className={`flex items-center gap-3 px-5 py-3.5 ${!canAssign ? 'opacity-50' : ''}`}
                                                >
                                                    {/* Avatar */}
                                                    <div className='w-9 h-9 rounded-xl bg-gray-100 overflow-hidden flex items-center justify-center shrink-0'>
                                                        {boy.image
                                                            ? <Image src={boy.image} alt={boy.name} width={36} height={36} className='object-cover w-full h-full' />
                                                            : <User className='w-4 h-4 text-gray-400' />}
                                                    </div>

                                                    {/* Info */}
                                                    <div className='flex-1 min-w-0'>
                                                        <p className='text-sm font-bold text-gray-800 truncate'>{boy.name}</p>
                                                        <div className='flex items-center gap-2 mt-0.5'>
                                                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${badgeClass}`}>
                                                                {badgeLabel}
                                                            </span>
                                                            <span className='text-[11px] text-gray-400'>
                                                                {boy.completedDeliveries} deliveries
                                                            </span>
                                                        </div>
                                                    </div>

                                                    {/* Assign button */}
                                                    <motion.button
                                                        whileTap={canAssign ? { scale: 0.95 } : {}}
                                                        disabled={!canAssign || !!assigning}
                                                        onClick={() => handleAssign(boy._id.toString())}
                                                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0
                                                            ${canAssign && !assigning
                                                                ? 'bg-blue-600 hover:bg-blue-700 text-white cursor-pointer'
                                                                : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}
                                                    >
                                                        {isAssigningThis
                                                            ? <Loader2 className='w-3.5 h-3.5 animate-spin' />
                                                            : 'Assign'}
                                                    </motion.button>
                                                </div>
                                            )
                                        })}
                                    </div>
                                )}
                            </div>

                            {/* Modal footer */}
                            <div className='px-5 py-3 border-t border-gray-100 bg-gray-50'>
                                <p className='text-[11px] text-gray-400 text-center'>
                                    Only <span className='font-semibold text-green-600'>Online & Available</span> delivery boys can be assigned
                                </p>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    )
}

export default AdminOrdersCart