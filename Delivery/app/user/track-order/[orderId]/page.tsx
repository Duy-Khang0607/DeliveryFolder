'use client'

import { useParams } from "next/navigation"
import axios from "axios"
import { useEffect, useState } from "react"
import { IOrder } from "@/app/models/orders.model"
import { RootState } from "@/app/redux/store"
import { useSelector } from "react-redux"
import { motion } from "framer-motion"
import { ArrowLeft, Box, MoveRight, CircleCheckBig, Check } from "lucide-react"
import { useRouter } from "next/navigation"
import LiveMap from "@/app/components/LiveMap"
import { getSocket } from "@/app/lib/socket"
import DeliveryChat from "@/app/components/DeliveryChat"

interface ILocation {
  latitude: number;
  longitude: number;
}

const TrackOrder = () => {
  const router = useRouter()
  const { userData } = useSelector((state: RootState) => state?.user)
  const { orderId } = useParams()
  const [order, setOrder] = useState<IOrder>()
  const [loading, setLoading] = useState(false)
  const [userLocation, setUserLocation] = useState<ILocation>({
    latitude: 0,
    longitude: 0,
  })
  const [deliveryBoyLocation, setDeliveryBoyLocation] = useState<ILocation>({
    latitude: 0,
    longitude: 0,
  })
  const [orderDelivered, setOrderDelivered] = useState<any>({})

  const fetchOrder = async () => {
    try {
      setLoading(true)
      const res = await axios.get(`/api/auth/user/get-order/${orderId}`)
      setOrder(res?.data?.order)
      setUserLocation({
        latitude: res?.data?.order?.address?.latitude,
        longitude: res?.data?.order?.address?.longitude,
      })
      setDeliveryBoyLocation({
        latitude: res?.data?.order?.assignedDeliveryBoy?.location?.coordinates?.[1],
        longitude: res?.data?.order?.assignedDeliveryBoy?.location?.coordinates?.[0],
      })
    } catch (error) {
      console.error({ error })
    } finally {
      setLoading(false)
    }
  }


  useEffect(() => {
    const socket = getSocket()

    socket?.on('update-deliveryBoy-location', (data) => {
      setDeliveryBoyLocation({
        latitude: data?.location?.coordinates?.[1],
        longitude: data?.location?.coordinates?.[0],
      })
    })

    socket?.on('order-delivered', (data) => {
      console.log({ data })
      if (data?.success) {
        setOrderDelivered(data)
      }
    })

    return () => {
      socket.off('update-deliveryBoy-location')
      socket.off('order-delivered')
    }
  }, [order])

  useEffect(() => {
    fetchOrder()
  }, [userData?._id])


  return (
    <div className='w-[90%] md:w-[80%] mx-auto mt-5 space-y-5'>
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
          {orderDelivered?.success ? (
            <div className='flex items-center justify-center min-h-screen'>
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                className='relative bg-white rounded-2xl shadow-xl border border-gray-100 p-8 max-w-sm w-full text-center overflow-hidden'
              >
                {/* Confetti decorations */}
                <div className="absolute top-0 left-0 w-full h-24 pointer-events-none overflow-hidden">
                  <motion.span initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="absolute top-3 left-6 w-2 h-2 bg-green-400 rounded-full" />
                  <motion.span initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="absolute top-5 left-16 w-3 h-1 bg-yellow-400 rounded-full rotate-45" />
                  <motion.span initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="absolute top-8 left-28 w-2 h-2 bg-red-400 rounded-full" />
                  <motion.span initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} className="absolute top-2 right-20 w-2 h-2 bg-blue-400 rounded-full" />
                  <motion.span initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="absolute top-6 right-8 w-3 h-1 bg-pink-400 rounded-full -rotate-45" />
                  <motion.span initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="absolute top-10 right-28 w-2 h-2 bg-orange-400 rounded-full" />
                  <motion.span initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }} className="absolute top-4 left-40 w-1.5 h-1.5 bg-purple-400 rounded-full" />
                  <motion.span initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="absolute top-12 left-10 w-3 h-1 bg-teal-400 rounded-full rotate-12" />
                </div>

                {/* Checkmark icon */}
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                  className='mx-auto mb-4 w-16 h-16 bg-green-100 rounded-full flex items-center justify-center'
                >
                  <CircleCheckBig className='w-10 h-10 text-green-600' strokeWidth={2} />
                </motion.div>

                {/* Title */}
                <h2 className="text-2xl font-bold text-gray-800 mb-1">🎉 Delivered!</h2>
                <p className="text-gray-600 text-sm mb-1">
                  Order <span className="font-semibold text-gray-800">#{orderDelivered?.orderId?.toString()?.slice(-6)}</span> has arrived.
                </p>
                <p className="text-gray-400 text-sm mb-5">Thank you for shopping with us.</p>

                {/* Divider */}
                <div className="border-t border-dashed border-gray-200 my-4" />

                {/* Info rows */}
                <div className="flex justify-between items-center mb-3 px-2">
                  <span className="text-gray-500 text-sm">Estimated delivery:</span>
                  <span className="text-green-600 font-semibold text-sm flex items-center gap-1">
                    Completed <Check className="w-4 h-4" />
                  </span>
                </div>
                <div className="flex justify-between items-center mb-6 px-2">
                  <span className="text-gray-500 text-sm">Payment status:</span>
                  <span className="text-green-600 font-semibold text-sm flex items-center gap-1">
                    Paid <Check className="w-4 h-4" />
                  </span>
                </div>

                {/* Button */}
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  whileHover={{ scale: 1.03 }}
                  onClick={() => router.push('/user/my-orders')}
                  className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl px-5 py-3 transition cursor-pointer"
                >
                  Track Another Order
                </motion.button>
              </motion.div>
            </div>
          ) : (
            <>
              <div className='flex flex-row items-center justify-start gap-4 border border-gray-300 rounded-md p-4 shadow-md overflow-hidden w-full h-full'>
                <motion.button
                  onClick={() => router.back()}
                  whileTap={{ scale: 0.97 }}
                  whileHover={{ scale: 1.06 }}
                  className='flex items-center gap-2 text-green-700 hover:text-green-800 font-semibold cursor-pointer bg-white shadow-lg p-2 rounded-xl'>
                  <ArrowLeft className='w-5 h-5' />
                  <span className='hidden md:flex font-semibold tracking-wide'>Back to home</span>
                </motion.button>

                <div className='flex flex-col gap-2'>
                  <h1 className='text-green-700 font-extrabold text-2xl md:text-3xl tracking-wide'>Track order</h1>
                  <p className='mb-4'>Order: <span className="text-red-500 text-sm font-semibold">#{order?._id?.toString()?.slice(-6)}</span> - <span className="text-green-700 font-semibold">{order?.status}</span></p>
                </div>
              </div>

              <div className="w-full h-full">
                <LiveMap userLocation={userLocation} deliveryLocation={deliveryBoyLocation} />
              </div>

              {
                order?._id && userData?._id && (
                  <DeliveryChat
                    orderId={order._id}
                    deliveryBoyId={userData._id}
                    role={userData?.role as 'user' | 'deliveryBoy' | 'admin'} />
                )
              }
            </>
          )}
        </>
      )}
    </div >
  )
}

export default TrackOrder