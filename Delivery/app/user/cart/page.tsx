'use client'
import { CircleMinus, CirclePlus, ShoppingBag, ShoppingBasket, Trash } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import Link from 'next/link'
import Image from 'next/image'
import { useDispatch, useSelector } from 'react-redux'
import { RootState } from '@/app/redux/store'
import { decreaseQuantity, ICartSlice, increaseQuantity, removeCart } from '@/app/redux/cartSlice'
import ButtonHome from '@/app/components/ButtonHome'

const Cart = () => {
    const dispatch = useDispatch()

    const { cartData, subTotal, deliveryFee, finalTotal } = useSelector((state: RootState) => state?.cart as ICartSlice)

    return (
        <section className='w-[90%] sm:w-[85%] md:w-[80%] mx-auto h-full pt-10'>
            {/* Back to home */}
            <div className='min-h-[40px]'>
                <ButtonHome />
            </div>

            {/* Title */}
            <motion.h1
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className='gap-2 flex flex-row w-full justify-center mt-4 mb-5'
            >
                <ShoppingBag className='w-10 h-10 text-gray-400' />
                <span className='text-green-700 text-2xl sm:text-3xl md:text-4xl font-bold'>Your Shopping Cart</span>
            </motion.h1>

            {/* Items */}
            <div className='grid grid-cols-1 lg:grid-cols-3 gap-5 pb-20'>
                {/* Items ordered */}
                <div className='lg:col-span-2 flex flex-col gap-4 relative'>
                    <AnimatePresence>
                        {cartData?.length === 0 ? (
                            <>
                                {/* Wrapper tạo hiệu ứng running border */}
                                <div className="relative p-[2px] rounded-2xl overflow-hidden group/card">
                                    {/* Lớp gradient xoay - ẩn mặc định, hiện khi hover */}
                                    <div
                                        className="absolute inset-0 opacity-0 group-hover/card:opacity-100 
               transition-opacity duration-300"
                                        style={{
                                            background: 'conic-gradient(from 0deg, transparent 0%, transparent 40%, #16a34a 55%, #4ade80 65%, transparent 75%)',
                                            animation: 'border-spin 4s linear infinite',
                                            borderRadius: 'inherit',
                                        }}
                                    />
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.4 }}
                                        className='relative w-full bg-white rounded-2xl border border-gray-100 shadow-md overflow-hidden flex flex-col items-center'
                                    >
                                        <div className='h-1 w-full bg-linear-to-r from-gray-200 to-gray-300' />
                                        <div className='py-16 flex flex-col items-center gap-3 px-6'>
                                            <ShoppingBasket className='w-14 h-14 text-gray-300' />
                                            <p className='text-base font-bold text-gray-400 text-center'>Your cart is empty</p>
                                            <p className='text-sm text-gray-400 text-center'>Add some groceries to continue shopping!</p>
                                            <Link
                                                href='/'
                                                className='mt-2 px-6 py-2.5 text-center bg-green-600 hover:bg-green-700 text-white rounded-xl text-sm font-semibold transition-all duration-200 shadow-sm cursor-pointer'
                                            >
                                                Continue Shopping
                                            </Link>
                                        </div>
                                    </motion.div>
                                </div>
                            </>
                        ) : (
                            cartData?.map((item, index) => (
                                <>
                                    {/* Wrapper tạo hiệu ứng running border */}
                                    <div className="relative p-[2px] rounded-2xl overflow-hidden group/card">
                                        {/* Lớp gradient xoay - ẩn mặc định, hiện khi hover */}
                                        <div
                                            className="absolute inset-0 opacity-0 group-hover/card:opacity-100 
               transition-opacity duration-300"
                                            style={{
                                                background: 'conic-gradient(from 0deg, transparent 0%, transparent 40%, #16a34a 55%, #4ade80 65%, transparent 75%)',
                                                animation: 'border-spin 4s linear infinite',
                                                borderRadius: 'inherit',
                                            }}
                                        />
                                        <motion.div
                                            key={index}
                                            initial={{ opacity: 0, y: 12 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, x: -20 }}
                                            transition={{ duration: 0.35, delay: index * 0.04 }}
                                            className='relative group w-full bg-white rounded-2xl border border-gray-100 shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col'
                                        >
                                            {/* Top accent bar */}
                                            <div className='h-1 w-full bg-linear-to-r from-green-400 to-green-700' />

                                            {/* Body */}
                                            <div className='p-4 flex flex-row items-center gap-4 flex-1'>
                                                {/* Image */}
                                                <div className='relative w-20 h-20 sm:w-24 sm:h-24 shrink-0 rounded-xl overflow-hidden border border-gray-100 shadow'>
                                                    <Image
                                                        src={item?.image[0]}
                                                        alt={item?.name}
                                                        fill
                                                        className='object-cover group-hover:scale-105 transition-transform duration-300'
                                                        sizes='(max-width: 640px) 80px, 96px'
                                                    />
                                                </div>

                                                {/* Info */}
                                                <div className='flex flex-col gap-1.5 flex-1 min-w-0'>
                                                    <h2 className='font-bold text-gray-800 text-sm md:text-base leading-snug line-clamp-2'>
                                                        {item?.name}
                                                    </h2>
                                                    <span className='inline-flex w-fit px-2 py-0.5 rounded-lg bg-gray-100 text-gray-500 text-[11px] font-medium'>
                                                        {item?.unit}
                                                    </span>
                                                    <p className='text-sm font-extrabold text-green-700'>
                                                        ${item?.price}
                                                        <span className='text-xs font-normal text-gray-400 ml-1'>× {item?.quantity}</span>
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Footer: Quantity + Remove */}
                                            <div className='px-4 py-3 bg-gray-50 border-t border-gray-100 flex flex-row items-center gap-3'>
                                                {/* Quantity control */}
                                                <div className='flex-1 bg-white rounded-xl border border-green-300 py-1.5'>
                                                    <div className='flex flex-row items-center justify-center gap-4'>
                                                        <motion.button
                                                            onClick={() => dispatch(decreaseQuantity(item?._id.toString()))}
                                                            whileTap={{ scale: 0.96 }}
                                                            className='text-green-600 hover:text-green-800 cursor-pointer transition-colors'
                                                        >
                                                            <CircleMinus className='w-5 h-5' />
                                                        </motion.button>
                                                        <span className='font-bold text-sm text-green-700 min-w-[20px] text-center'>
                                                            {item?.quantity}
                                                        </span>
                                                        <motion.button
                                                            onClick={() => dispatch(increaseQuantity(item?._id.toString()))}
                                                            whileTap={{ scale: 0.96 }}
                                                            className='text-green-600 hover:text-green-800 cursor-pointer transition-colors'
                                                        >
                                                            <CirclePlus className='w-5 h-5' />
                                                        </motion.button>
                                                    </div>
                                                </div>
                                                {/* Remove button */}
                                                <motion.button
                                                    whileTap={{ scale: 0.95 }}
                                                    whileHover={{ scale: 1.08 }}
                                                    onClick={() => dispatch(removeCart(item?._id.toString()))}
                                                    className='bg-red-50 hover:bg-red-500 text-red-500 hover:text-white rounded-xl p-2.5 transition-all duration-200 border border-red-200 hover:border-transparent cursor-pointer'
                                                >
                                                    <Trash className='w-4 h-4' />
                                                </motion.button>
                                            </div>
                                        </motion.div>
                                    </div>
                                </>
                            ))
                        )}
                    </AnimatePresence >
                </div>

                {/* Order Summary */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.1 }}
                    className='w-full rounded-2xl border border-gray-100 shadow-md overflow-hidden flex flex-col h-fit lg:sticky lg:top-5 bg-white'
                >
                    {/* Top accent bar */}
                    <div className='h-1 w-full bg-linear-to-r from-green-400 to-green-700' />

                    {/* Header */}
                    <div className='p-4 border-b border-dashed border-gray-100 flex items-center gap-2'>
                        <ShoppingBag className='w-4 h-4 text-green-700' />
                        <h2 className='font-bold text-gray-800 text-sm'>Order Summary</h2>
                    </div>

                    {/* Body */}
                    <div className='p-4 flex flex-col gap-3'>
                        <div className='flex items-center justify-between'>
                            <span className='text-sm text-gray-500'>Subtotal</span>
                            <span className='text-sm font-bold text-green-700'>${subTotal}</span>
                        </div>
                        <div className='flex items-center justify-between'>
                            <span className='text-sm text-gray-500'>Delivery Fee</span>
                            <span className='text-sm font-bold text-green-700'>
                                {deliveryFee === 0 ? 'Free 🎉' : `$${deliveryFee}`}
                            </span>
                        </div>

                        <div className='border-t border-dashed border-gray-100' />

                        <div className='flex items-center justify-between'>
                            <span className='font-extrabold text-gray-800 text-base'>Final Total</span>
                            <span className='font-extrabold text-green-700 text-base'>${finalTotal}</span>
                        </div>

                        {cartData?.length > 0 && (
                            <p className='text-xs text-gray-400'>{cartData?.length} item{cartData?.length > 1 ? 's' : ''} in cart</p>
                        )}
                    </div>

                    {/* Footer: CTA */}
                    <div className='px-4 py-3 bg-gray-50 border-t border-gray-100'>
                        {cartData?.length > 0 ? (
                            <Link
                                href='/user/checkout'
                                className='block w-full py-2.5 text-center text-white text-sm font-semibold rounded-xl bg-green-600 hover:bg-green-700 transition-all duration-200 shadow-sm'
                            >
                                Proceed to Checkout
                            </Link>
                        ) : (
                            <div className='w-full py-2.5 text-center text-white text-sm font-semibold rounded-xl bg-gray-300 cursor-not-allowed'>
                                Proceed to Checkout
                            </div>
                        )}
                    </div>
                </motion.div>
            </div>
        </section>
    )
}

export default Cart