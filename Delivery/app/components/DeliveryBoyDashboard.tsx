'use client'
import axios from 'axios';
import React, { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Box, CardSim, Loader2, LocationEdit, Mail, Phone, Timer, User } from 'lucide-react';
import { getSocket } from '../lib/socket';
import { useSelector } from 'react-redux';
import dynamic from 'next/dynamic';
import { useToast } from './Toast';
import { Bar, BarChart, CartesianGrid, Cell, LabelList, Legend, PolarAngleAxis, RadialBar, RadialBarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

const LiveMap = dynamic(() => import('./LiveMap'), { ssr: false, loading: () => <div className='w-full h-64 bg-gray-100 animate-pulse rounded-lg' /> });
const DeliveryChat = dynamic(() => import('./DeliveryChat'), { ssr: false });

interface IDeliveryLocation {
    latitude: number;
    longitude: number;
}

const DeliveryBoyDashboard = ({ earning: initialEarning }: { earning: number }) => {
    const [earning, setEarning] = useState(initialEarning);
    const [assignments, setAssignments] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [currentOrder, setCurrentOrder] = useState<any>(null);
    const [userlocation, setUserlocation] = useState<IDeliveryLocation>({
        latitude: 0,
        longitude: 0,
    });
    const [deliverylocation, setDeliverylocation] = useState<IDeliveryLocation>({
        latitude: 0,
        longitude: 0,
    });
    const { userData } = useSelector((state: any) => state?.user);

    // Mark as delivered
    const [showOTP, setShowOTP] = useState(false);
    const [loadingMarkAsDelivered, setLoadingMarkAsDelivered] = useState(false);

    // Send OTP
    const [otp, setOtp] = useState('');
    const [loadingOTP, setLoadingOTP] = useState(false);
    const { showToast } = useToast();

    const getAssignments = async () => {
        try {
            if (assignments?.length === 0) setLoading(true);
            const response = await axios.get('/api/delivery/get-assignments');
            const filterData = response?.data?.assignments?.filter((data: any) => data?.order?.status !== 'Pending');
            setAssignments(filterData);
        } catch (error:any) {
            showToast(error?.response?.data?.message || 'Failed to get assignments !', 'error');
            setLoading(false);
        } finally {
            setLoading(false);
        }
    }

    const handleAccept = async (assignmentId: string, orders: any) => {
        try {
            setLoading(true);
            const res = await axios.get(`/api/delivery/assignment/${assignmentId}/accept-assignment`);
            if (res?.data?.success) {
                setCurrentOrder(orders);
                setUserlocation({
                    latitude: orders?.order?.address?.latitude,
                    longitude: orders?.order?.address?.longitude,
                });
                setShowOTP(false)
                showToast(res?.data?.message || 'Order accepted', 'success');
            }
        } catch (error: any) {
            setLoading(false);
            showToast(error?.response?.data?.message || 'Failed to accept order !', 'error');
            throw error;
        } finally {
            setLoading(false);
        }
    }

    const handleReject = async (assignmentId: string) => {
        setAssignments((prev) => prev.filter((item: any) =>
            (item?._id?.toString() !== assignmentId?.toString()) &&
            (item?.assignment?.toString() !== assignmentId?.toString()) &&
            (item?.order?.assignment?.toString() !== assignmentId?.toString())
        ))
        try {
            await axios.post(`/api/delivery/assignment/${assignmentId}/reject-assignment`);
            showToast('Order rejected', 'success');
        } catch (error) {
            await getAssignments();
            showToast('Failed to reject order', 'error');
        }
    }

    const fetchCurrentOrder = async () => {
        try {
            const response = await axios.get('/api/delivery/current-order');
            setCurrentOrder(response?.data?.assignment);
            setUserlocation({
                latitude: response?.data?.assignment?.order?.address?.latitude,
                longitude: response?.data?.assignment?.order?.address?.longitude,
            })
        } catch (error: any) {
            showToast(error?.response?.data?.message || 'Failed to get current order !', 'error');
        }
    }

    const sendOTP = async (orderId: string) => {
        setLoadingMarkAsDelivered(true);
        try {
            await axios.post(`/api/delivery/otp/send`, { orderId });
            setShowOTP(true);
            showToast('OTP sent successfully', 'success');
        } catch (error: any) {
            setShowOTP(false);
            setLoadingMarkAsDelivered(false);
            showToast(error?.response?.data?.message || 'Failed to send OTP !', 'error');
        } finally {
            setLoadingMarkAsDelivered(false);
        }
    }

    const verifyOTP = async (orderId: string, otp: string) => {
        setLoadingOTP(true);
        try {
            await axios.post(`/api/delivery/otp/verify`, { orderId, otp });
            setOtp('');
            setEarning((prev) => prev + 40);
            await fetchCurrentOrder();
            await getAssignments();
            window.scrollTo({ top: 0, behavior: "smooth" });
        } catch (error: any) {
            showToast(error?.response?.data?.message || 'Failed to verify OTP !', 'error');
            setLoadingOTP(false);
        }
        finally {
            setLoadingOTP(false);
        }
    }

    // Lấy vị trí hiện tại của delivery boy
    useEffect(() => {
        if (!userData?._id) return
        if (!navigator?.geolocation) return

        const watcher = navigator.geolocation.watchPosition(
            (pos) => {
                const { latitude, longitude } = pos?.coords
                setDeliverylocation({
                    latitude,
                    longitude
                })
            },
            (error) => {
                // Xử lý các loại lỗi Geolocation
                const errorMessages: { [key: number]: string } = {
                    1: 'Người dùng từ chối cấp quyền vị trí. Vui lòng cho phép truy cập vị trí trong cài đặt trình duyệt.',
                    2: 'Không thể xác định vị trí. Vui lòng kiểm tra GPS/Location services.',
                    3: 'Hết thời gian chờ lấy vị trí. Vui lòng thử lại.'
                };
                console.warn("⚠️ Geolocation error:", errorMessages[error.code] || error.message);
            }, {
            enableHighAccuracy: false,  // Đổi thành false để nhanh hơn và ít lỗi hơn
            maximumAge: 30000,          // Cache vị trí trong 30 giây
            timeout: 15000,             // Tăng timeout lên 15 giây
        }
        )

        return () => navigator.geolocation.clearWatch(watcher)

    }, [userData?._id])

    // Call api lấy danh sách tài xế và đơn hàng được phân công
    useEffect(() => {
        getAssignments();
        fetchCurrentOrder();
    }, [userData?._id]);

    useEffect(() => {
        const socket = getSocket()

        const handleAssignmentRejected = (data: any) => {
            const { assignmentId, orderId, deliveryBoyId } = data
            if (deliveryBoyId?.toString() !== userData?._id?.toString()) return
            setAssignments((prev) => prev?.filter((item: any) =>
                item?._id?.toString() !== assignmentId?.toString() &&
                item?.order?._id?.toString() !== orderId?.toString()
            ))
        }

        socket?.on('assignment-rejected', handleAssignmentRejected)

        return () => { socket?.off('assignment-rejected', handleAssignmentRejected) }
    }, [userData?._id])

    useEffect(() => {
        const socket = getSocket()

        const handleOrderStatusUpdated = (data: any) => {
            if (data?.status === 'Pending') {
                showToast('Assigment canceled !', 'warning')
                setAssignments((prev) => prev?.filter((item: any) => item?.order?._id.toString() !== data?.orderId?.toString()))
                setCurrentOrder((prev: any) => {
                    if (prev?.order?._id?.toString() === data?.orderId?.toString()) {
                        setUserlocation({ latitude: 0, longitude: 0 })
                        return null
                    }
                    return prev
                })
            }
        }

        const handleNewAssignment = (newAssignment: any) => {
            setAssignments((prev) => {

                // Normalize: socket item có `assignment`, API item có `_id`
                // Unify thành `_id` để nhất quán
                const normalized = {
                    ...newAssignment,
                    _id: newAssignment._id || newAssignment.assignment,
                }

                const alreadyExists = prev.some(
                    (item: any) =>
                        item?._id?.toString() === normalized?._id?.toString() ||
                        item?.order?._id?.toString() === normalized?.order?._id?.toString()
                );
                if (alreadyExists) return prev;
                return [...prev, newAssignment];
            });
        }

        const handleLocationUpdate = (data: any) => {
            setDeliverylocation({
                latitude: data?.location?.coordinates?.[1],
                longitude: data?.location?.coordinates?.[0],
            })
        }

        const handleAssignmentAccepted = (data: any) => {
            const { assignmentId, orderId } = data
            setAssignments((prev) => prev?.filter((item: any) =>
                item?._id?.toString() !== assignmentId?.toString() &&
                item?.order?._id?.toString() !== orderId?.toString()
            ))
        }

        socket?.on('order-status-updated', handleOrderStatusUpdated)
        socket?.on('new-assignment', handleNewAssignment)
        socket?.on('update-deliveryBoy-location', handleLocationUpdate)
        socket?.on('assignment-accepted', handleAssignmentAccepted)

        return () => {
            socket?.off('order-status-updated', handleOrderStatusUpdated)
            socket?.off('new-assignment', handleNewAssignment)
            socket?.off('update-deliveryBoy-location', handleLocationUpdate)
            socket?.off('assignment-accepted', handleAssignmentAccepted)
        }
    }, [])

    const todayEarningData = [
        { name: "Today", earning, deliveries: earning / 40 }
    ]

    if (assignments?.length === 0 && !currentOrder) {
        return (
            <div className='w-[90%] mx-auto mt-24 mb-12 h-full'>
                {/* Header */}
                <div className='mb-8'>
                    <p className='text-xs font-semibold uppercase tracking-widest text-green-500 mb-1'>Dashboard</p>
                    <h1 className='text-2xl sm:text-3xl font-extrabold text-gray-800'>Delivery Boy</h1>
                </div>

                {/* Earning banner */}
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.45 }}
                    className='relative overflow-hidden rounded-2xl bg-gradient-to-br from-green-600 to-emerald-500 p-6 sm:p-8 mb-6 shadow-lg'
                >
                    <div className='absolute -top-8 -right-8 w-40 h-40 rounded-full bg-white/10' />
                    <div className='absolute -bottom-10 -left-6 w-32 h-32 rounded-full bg-white/10' />
                    <p className='text-green-100 text-sm font-medium mb-1 relative'>Today&apos;s Earnings</p>
                    <p className='text-4xl sm:text-5xl font-extrabold text-white relative tracking-tight'>${earning.toFixed(2)}</p>
                    <p className='text-green-100 text-xs mt-3 relative'>{Math.round(earning / 40)} deliveries completed today</p>
                </motion.div>

                {/* Chart card */}
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.45, delay: 0.1 }}
                    className='bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-6 mb-6'
                >
                    <div className='flex items-center justify-between mb-4'>
                        <div>
                            <h2 className='text-sm font-bold text-gray-700'>Today Performance</h2>
                            <p className='text-xs text-gray-400 mt-0.5'>Earnings &amp; Deliveries</p>
                        </div>
                        <span className='px-2.5 py-1 bg-green-50 text-green-600 rounded-full text-xs font-semibold'>Daily</span>
                    </div>
                    {/* Stat row */}
                    <div className='grid grid-cols-2 gap-3 mb-5'>
                        <div className='flex flex-col items-center justify-center bg-green-50 rounded-2xl py-4 border border-green-100'>
                            <p className='text-xs text-gray-400 font-semibold uppercase tracking-widest mb-1'>Earned</p>
                            <p className='text-2xl font-extrabold text-green-700'>${earning.toFixed(2)}</p>
                        </div>
                        <div className='flex flex-col items-center justify-center bg-emerald-50 rounded-2xl py-4 border border-emerald-100'>
                            <p className='text-xs text-gray-400 font-semibold uppercase tracking-widest mb-1'>Deliveries</p>
                            <p className='text-2xl font-extrabold text-emerald-600'>{Math.round(earning / 40)}</p>
                        </div>
                    </div>

                    {/* Radial chart */}
                    <div className='relative flex flex-col items-center'>
                        <ResponsiveContainer width="100%" height={220}>
                            <RadialBarChart
                                cx="50%" cy="50%"
                                innerRadius="40%" outerRadius="90%"
                                data={[
                                    { name: 'Deliveries', value: Math.min(Math.round(earning / 40), 9999), fill: '#86efac', max: 9999 },
                                    { name: 'Earning ($)', value: Math.min(earning, 999999), fill: '#16a34a', max: 999999 },
                                ]}
                                startAngle={180} endAngle={-180}
                            >
                                <PolarAngleAxis type="number" domain={[0, 200]} angleAxisId={0} tick={false} />
                                <RadialBar background={{ fill: '#f0fdf4' }} dataKey="value" cornerRadius={8} />
                                <Tooltip
                                    formatter={(value, name) => name === 'Earning ($)' ? [`$${value}`, name] : [value, name]}
                                    contentStyle={{ borderRadius: "10px", border: "none", boxShadow: "0 4px 20px rgba(0,0,0,0.08)", fontSize: "13px" }}
                                />
                                <Legend iconType='circle' iconSize={8} wrapperStyle={{ fontSize: "12px", paddingTop: "8px" }} />
                            </RadialBarChart>
                        </ResponsiveContainer>
                        {/* Center label */}
                        <div className='absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center pointer-events-none'>
                            <span className='text-xs text-gray-400 font-medium'>Today</span>
                            <span className='text-lg font-extrabold text-green-700'>${earning.toFixed(0)}</span>
                        </div>
                    </div>
                </motion.div>

                {/* Empty state */}
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.2 }}
                    className='flex flex-col items-center justify-center gap-3 py-10 bg-gray-50 rounded-2xl border border-dashed border-gray-200'
                >
                    <div className='w-14 h-14 rounded-2xl bg-green-50 flex items-center justify-center'>
                        <Box className='w-7 h-7 text-green-500' />
                    </div>
                    <p className='text-gray-800 font-bold text-base'>No Active Delivery</p>
                    <p className='text-gray-400 text-sm text-center max-w-xs'>You don&apos;t have any active delivery right now. New orders will appear here automatically.</p>
                    <motion.button
                        whileTap={{ scale: 0.95 }}
                        whileHover={{ scale: 1.02 }}
                        onClick={() => window.location.reload()}
                        className='mt-2 px-5 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded-xl transition-all duration-200 cursor-pointer'
                    >
                        Refresh Earnings
                    </motion.button>
                </motion.div>
            </div>
        )
    }

    if (currentOrder && userlocation) {
        return (
            <div className='pt-24 pb-12 px-4 sm:px-6 max-w-7xl mx-auto space-y-4'>

                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, x: -16 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.35 }}
                >
                    <p className='text-xs font-semibold uppercase tracking-widest text-green-500 mb-1'>In Progress</p>
                    <div className='flex items-center gap-3'>
                        <h1 className='text-2xl sm:text-3xl font-extrabold text-gray-800'>Active Order</h1>
                        <span className='px-2.5 py-1 bg-green-50 border border-green-200 text-green-700 rounded-full text-xs font-bold tracking-wide'>
                            #{currentOrder?.order?._id?.slice(-6)}
                        </span>
                    </div>
                </motion.div>

                {/* Map */}
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                    className='bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden'
                >
                    <div className='px-5 py-4 border-b border-gray-100 flex items-center justify-between'>
                        <h2 className='text-sm font-bold text-gray-700'>Live Tracking</h2>
                        <span className='flex items-center gap-1.5 text-xs font-semibold text-green-600'>
                            <span className='w-2 h-2 rounded-full bg-green-500 animate-pulse' />
                            Live
                        </span>
                    </div>
                    <LiveMap userLocation={userlocation} deliveryLocation={deliverylocation} />
                </motion.div>

                {/* Chat */}
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.05 }}
                    className='bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden'
                >
                    <DeliveryChat orderId={String(currentOrder?.order?._id)} deliveryBoyId={String(userData?._id)} role={userData?.role as 'user' | 'deliveryBoy' | 'admin'} />
                </motion.div>

                {/* OTP */}
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.1 }}
                    className='bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-6'
                >
                    <h2 className='text-sm font-bold text-gray-700 mb-4'>Delivery Confirmation</h2>

                    {!currentOrder?.order?.deliveryOTPVerification && !showOTP && (
                        <motion.button
                            whileTap={{ scale: 0.97 }}
                            onClick={() => sendOTP(currentOrder?.order?._id!)}
                            className='w-full py-3 rounded-xl bg-green-600 hover:bg-green-700 text-white font-bold text-sm flex items-center justify-center gap-2 transition-all duration-200 cursor-pointer shadow-md shadow-green-100'
                        >
                            {loadingMarkAsDelivered
                                ? <Loader2 className='w-4 h-4 animate-spin' />
                                : 'Mark as Delivered'}
                        </motion.button>
                    )}

                    {showOTP && (
                        <div className='flex flex-col gap-3'>
                            <p className='text-xs text-gray-400'>Enter the 6-digit OTP sent to the customer.</p>
                            <div className='relative'>
                                <input
                                    type="text"
                                    placeholder='Enter 6-digit OTP'
                                    className='w-full pl-4 pr-28 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500 text-sm transition-all duration-200'
                                    value={otp}
                                    onChange={(e) => setOtp(e.target.value)}
                                    maxLength={6}
                                />
                                <button
                                    onClick={() => sendOTP(currentOrder?.order?._id!)}
                                    className='absolute top-1/2 right-2 -translate-y-1/2 px-3 py-1.5 text-xs font-semibold text-green-600 hover:text-green-700 flex items-center gap-1.5 border border-green-200 hover:border-green-300 rounded-lg transition-all cursor-pointer bg-green-50'
                                >
                                    {loadingMarkAsDelivered
                                        ? <Loader2 className='w-3.5 h-3.5 animate-spin' />
                                        : <><Mail className='w-3.5 h-3.5' /> Resend</>}
                                </button>
                            </div>
                            <motion.button
                                whileTap={{ scale: 0.97 }}
                                onClick={() => verifyOTP(currentOrder?.order?._id!, otp)}
                                disabled={otp.length !== 6}
                                className={`w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all duration-200
                                    ${otp.length !== 6
                                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                        : 'bg-green-600 hover:bg-green-700 text-white cursor-pointer shadow-md shadow-green-100'}`}
                            >
                                {loadingOTP ? <Loader2 className='w-4 h-4 animate-spin' /> : 'Verify & Complete'}
                            </motion.button>
                        </div>
                    )}
                </motion.div>
            </div>
        )
    }

    return (
        <div className='pt-24 pb-12 px-4 sm:px-6 max-w-7xl mx-auto'>
            {/* Header */}
            <div className='flex items-center justify-between mb-8'>
                <div>
                    <p className='text-xs font-semibold uppercase tracking-widest text-green-500 mb-1'>Incoming</p>
                    <h1 className='text-2xl sm:text-3xl font-extrabold text-gray-800'>New Assignments</h1>
                </div>
                {assignments?.length > 0 && (
                    <span className='w-8 h-8 flex items-center justify-center rounded-full bg-green-600 text-white text-sm font-bold'>
                        {assignments?.length}
                    </span>
                )}
            </div>

            {loading ? (
                <motion.div
                    initial={{ y: 40, opacity: 0 }}
                    animate={{ y: [0, -10, 0], opacity: 1 }}
                    transition={{ delay: 0.2, duration: 3, repeat: Infinity, ease: "easeInOut" }}
                    className='flex flex-col items-center justify-center py-32 gap-4'
                >
                    <Box className='w-16 h-16 text-green-400' />
                    <p className='text-sm text-gray-400 font-medium'>Loading assignments...</p>
                </motion.div>
            ) : (
                <AnimatePresence>
                    <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
                        {assignments?.length > 0 && assignments?.map((orders, index) => {
                            const { _id, paymentMethod, createdAt, address } = orders?.order
                            const { fullName, mobile } = orders?.order?.address
                            const assignmentId = orders?._id || orders?.assignment || orders?.order?.assignment;

                            return (
                                <motion.div
                                    initial={{ opacity: 0, y: 16 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.35, delay: index * 0.06 }}
                                    key={_id}
                                    className='bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col'
                                >
                                    {/* Card header */}
                                    <div className='px-5 pt-5 pb-4 border-b border-gray-50'>
                                        <div className='flex items-start justify-between gap-2'>
                                            <div className='flex items-center gap-2.5'>
                                                <div className='w-9 h-9 rounded-xl bg-green-50 flex items-center justify-center shrink-0'>
                                                    <User className='w-4 h-4 text-green-600' />
                                                </div>
                                                <div>
                                                    <p className='text-sm font-bold text-gray-800 leading-tight'>{fullName}</p>
                                                    <p className='text-xs text-green-600 font-semibold'>#{_id?.slice(-6)}</p>
                                                </div>
                                            </div>
                                            <span className={`shrink-0 px-2 py-0.5 rounded-full text-xs font-semibold ${paymentMethod === 'online' ? 'bg-blue-50 text-blue-600' : 'bg-amber-50 text-amber-600'}`}>
                                                {paymentMethod === 'online' ? 'Online' : 'COD'}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Card body */}
                                    <div className='px-5 py-4 flex flex-col gap-3 flex-1'>
                                        <div className='flex items-center gap-2.5'>
                                            <Phone className='w-4 h-4 text-gray-400 shrink-0' />
                                            <span className='text-sm text-gray-600'>{mobile}</span>
                                        </div>
                                        <div className='flex items-center gap-2.5'>
                                            <Timer className='w-4 h-4 text-gray-400 shrink-0' />
                                            <span className='text-xs text-gray-400'>{new Date(createdAt).toLocaleString()}</span>
                                        </div>
                                        <div className='flex items-start gap-2.5'>
                                            <LocationEdit className='w-4 h-4 text-gray-400 shrink-0 mt-0.5' />
                                            <span className='text-sm text-gray-600 leading-snug'>{address?.fullAddress}</span>
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className='px-5 pb-5 flex gap-2.5'>
                                        <motion.button
                                            whileTap={{ scale: 0.96 }}
                                            onClick={() => handleAccept(assignmentId, orders)}
                                            className='flex-1 py-2.5 rounded-xl bg-green-600 hover:bg-green-700 text-white text-sm font-bold transition-all duration-200 cursor-pointer'
                                        >
                                            Accept
                                        </motion.button>
                                        <motion.button
                                            whileTap={{ scale: 0.96 }}
                                            onClick={() => handleReject(orders?._id || orders?.assignment || orders?.order?.assignment)}
                                            className='flex-1 py-2.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-500 text-sm font-bold transition-all duration-200 cursor-pointer border border-red-100'
                                        >
                                            Reject
                                        </motion.button>
                                    </div>
                                </motion.div>
                            )
                        })}
                    </div>
                </AnimatePresence>
            )}
        </div>
    )
}

export default DeliveryBoyDashboard