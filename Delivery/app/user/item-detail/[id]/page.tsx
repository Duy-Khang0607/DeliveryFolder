'use client'
import { AlertTriangle, CircleMinus, CirclePlus, DollarSign, Info, Package, ShoppingBag, ShoppingBasket, Tag, Trash, Warehouse } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import Link from 'next/link'
import Image from 'next/image'
import { useDispatch, useSelector } from 'react-redux'
import { RootState } from '@/app/redux/store'
import { addToCart, decreaseQuantity, ICartSlice, increaseQuantity, removeCart } from '@/app/redux/cartSlice'
import ButtonHome from '@/app/components/ButtonHome'
import { useState } from 'react'
import { IGrocery } from '@/app/models/grocery.model'
import { use } from 'react'
import PopupImage from '@/app/HOC/PopupImage'
import { useGetGroceryById } from '@/app/hooks/useGroceryId'

const ItemDetail = ({ params }: { params: Promise<{ id: string }> }) => {
    const { id } = use(params)
    const [open, setOpen] = useState(false);

    const { cartData, subTotal, deliveryFee, finalTotal } = useSelector((state: RootState) => state?.cart as ICartSlice)
    const dispatch = useDispatch()
    const cartItem = cartData?.find(ci => ci?._id?.toString() === id)

    const { data, isLoading } = useGetGroceryById(id)
    const item = data?.grocery as IGrocery

    // Stock
    const stock = item?.stock ?? 0
    const isOut = stock === 0
    const isLow = stock > 0 && stock <= 10
    const MAX_DISPLAY = 100

    const badgeClass = isOut
        ? 'bg-red-50 text-red-600 border-red-200'
        : isLow
            ? 'bg-amber-50 text-amber-600 border-amber-200'
            : 'bg-green-50 text-green-700 border-green-200'

    const barColor = isOut
        ? 'bg-red-400'
        : isLow
            ? 'bg-amber-400'
            : 'bg-green-500'

    const barWidth = `${Math.min((stock / MAX_DISPLAY) * 100, 100)}%`

    const isStockColor = isOut ? 'text-red-500' : isLow ? 'text-amber-400' : 'text-green-700'

    return (
        <section className='w-[90%] sm:w-[85%] md:w-[80%] mx-auto h-full pt-10 pb-20'>
            {/* Back to home */}
            <div className='min-h-[40px]'>
                <ButtonHome />
            </div>

            {/* Title */}
            <motion.h1
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className='gap-2 flex flex-row w-full justify-center items-center mt-4 mb-6'
            >
                <Info className='w-10 h-10 text-gray-400' />
                <span className='text-green-700 text-2xl sm:text-3xl md:text-4xl font-bold'>Item Detail</span>
            </motion.h1>

            {/* Grid layout */}
            <div className='grid grid-cols-1 lg:grid-cols-3 gap-5'>

                {/* Left panel: Item detail card */}
                <div className='lg:col-span-2'>
                    {isLoading ? (
                        <motion.div
                            initial={{ y: 40, opacity: 0 }}
                            animate={{ y: [0, -10, 0], opacity: 1 }}
                            transition={{ delay: 0.2, duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                            className='flex flex-col items-center justify-center min-h-[300px]'
                        >
                            <ShoppingBag className='w-16 h-16 text-green-700' />
                        </motion.div>
                    ) : !item ? (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.4 }}
                            className='flex flex-col items-center justify-center py-20 gap-3'
                        >
                            <ShoppingBasket className='w-14 h-14 text-gray-300' />
                            <p className='text-base font-bold text-gray-400'>Item not found</p>
                        </motion.div>
                    ) : (
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
                                    className='relative bg-white rounded-[14px] border border-transparent shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col group z-10'>

                                    {/* Top accent bar */}
                                    <div className='h-1 w-full bg-linear-to-r from-green-400 to-green-700' />

                                    {/* Body */}
                                    <div className='p-5 sm:p-6 flex flex-col sm:flex-row gap-5 items-start flex-1'>
                                        {/* Product image */}
                                        <div className='relative sm:w-56 md:h-56 shrink-0 rounded-xl overflow-hidden border border-gray-100 shadow cursor-pointer w-full h-full'
                                            onClick={() => setOpen(true)}>
                                            {item?.image[0] ? (
                                                <Image
                                                    src={item?.image[0]}
                                                    alt={item?.name}
                                                    width={224}
                                                    height={224}
                                                    loading='eager'
                                                    className='object-contain group-hover:scale-105 transition-transform duration-400 w-full h-full cursor-pointer'
                                                />
                                            ) : (
                                                <div className='w-full h-full flex items-center justify-center bg-gray-100'>
                                                    <Package className='w-6 h-6 text-green-400' />
                                                </div>
                                            )}
                                        </div>

                                        {/* Info */}
                                        <div className='flex flex-col gap-3 flex-1 min-w-0 w-full'>
                                            {/* Category badge */}
                                            <span className='flex items-center gap-1 w-fit px-2.5 py-0.5 rounded-full bg-green-50 border border-green-200 text-green-700 text-[11px] font-bold tracking-widest uppercase'>
                                                <Tag className='w-3 h-3' />
                                                {item?.category}
                                            </span>

                                            {/* Name */}
                                            <h2 className='font-extrabold text-gray-800 text-xl sm:text-2xl leading-snug'>
                                                {item?.name}
                                            </h2>

                                            {/* Divider */}
                                            <div className='border-t border-dashed border-gray-100' />

                                            {/* Details rows */}
                                            <div className='flex flex-col gap-2.5'>
                                                {/* Price && Unit */}
                                                <div className='flex items-center gap-2'>
                                                    <DollarSign className='w-4 h-4 text-gray-400 shrink-0' />
                                                    <p className='text-xl font-extrabold text-green-700'>${item?.price}</p>
                                                </div>
                                                <div className='flex items-center gap-2'>
                                                    <Package className='w-4 h-4 text-gray-400 shrink-0' />
                                                    <p className='text-sm text-gray-500'>
                                                        Unit: <span className='font-semibold text-gray-700'>{item?.unit || '—'}</span>
                                                    </p>
                                                </div>

                                                {/* ── Stock display ── */}
                                                <div className='flex flex-col gap-2 pt-1'>
                                                    {/* Badge row */}
                                                    <div className='flex items-center justify-between'>
                                                        <div className='flex items-center gap-1.5'>
                                                            <Warehouse className='w-4 h-4 text-gray-400 shrink-0' />
                                                            <span className='text-sm text-gray-500'>Availability</span>
                                                            <span className={`${isStockColor} font-bold`}>{stock}</span>
                                                        </div>
                                                        <span className={`flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${badgeClass}`}>
                                                            {isOut && <AlertTriangle className='w-3 h-3' />}
                                                            {isOut ? 'Out of Stock' : isLow ? `Only ${stock} left!` : 'In Stock'}
                                                        </span>
                                                    </div>

                                                    {/* Progress bar */}
                                                    <div className='h-1.5 w-full bg-gray-100 rounded-full overflow-hidden'>
                                                        <motion.div
                                                            className={`h-full rounded-full ${barColor}`}
                                                            initial={{ width: 0 }}
                                                            animate={{ width: barWidth }}
                                                            transition={{ duration: 0.5, ease: 'easeOut' }}
                                                        />
                                                    </div>

                                                    {/* Low stock warning */}
                                                    {isLow && !isOut && (
                                                        <motion.p
                                                            initial={{ opacity: 0, y: -4 }}
                                                            animate={{ opacity: 1, y: 0 }}
                                                            className='text-xs text-amber-600 font-semibold flex items-center gap-1'
                                                        >
                                                            <AlertTriangle className='w-3 h-3' />
                                                            Hurry! Almost sold out.
                                                        </motion.p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Footer: Add to Cart / Quantity + Remove */}
                                    <div className='px-5 sm:px-6 py-4 bg-gray-50 border-t border-gray-100'>
                                        <AnimatePresence mode='wait'>
                                            {cartItem ? (
                                                <motion.div
                                                    key='qty'
                                                    initial={{ opacity: 0, y: 6 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    exit={{ opacity: 0, y: -6 }}
                                                    transition={{ duration: 0.25 }}
                                                    className='flex flex-row items-center gap-3'
                                                >
                                                    {/* Quantity control */}
                                                    <div className='flex-1 bg-white rounded-xl border border-green-300 py-2'>
                                                        <div className='flex flex-row items-center justify-center gap-5'>
                                                            <CircleMinus
                                                                onClick={() => dispatch(decreaseQuantity(item?._id.toString()))}
                                                                className='w-5 h-5 text-green-600 hover:text-green-800 cursor-pointer transition-colors'
                                                            />
                                                            <span className='font-bold text-base text-green-700 min-w-[20px] text-center'>
                                                                {cartItem?.quantity}
                                                            </span>
                                                            <CirclePlus
                                                                onClick={() => {
                                                                    if ((cartItem?.quantity ?? 0) < stock) {
                                                                        dispatch(increaseQuantity(item._id.toString()))
                                                                    }
                                                                }}
                                                                className={`w-5 h-5 text-green-600 hover:text-green-800 cursor-pointer transition-colors ${(cartItem?.quantity ?? 0) >= stock ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
                                                            />
                                                        </div>
                                                    </div>
                                                    {/* Remove button */}
                                                    <motion.button
                                                        whileTap={{ scale: 0.95 }}
                                                        whileHover={{ scale: 1.08 }}
                                                        onClick={() => dispatch(removeCart(item?._id.toString()))}
                                                        className='bg-red-50 hover:bg-red-500 text-red-500 hover:text-white rounded-xl p-2.5 transition-all duration-200 border border-red-200 hover:border-transparent cursor-pointer'
                                                    >
                                                        <Trash className='w-5 h-5' />
                                                    </motion.button>
                                                </motion.div>
                                            ) : (
                                                <motion.button
                                                    key='add'
                                                    initial={{ opacity: 0, y: 6 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    exit={{ opacity: 0, y: -6 }}
                                                    transition={{ duration: 0.25 }}
                                                    onClick={() => (item?.stock ?? 0) > 0 && dispatch(addToCart({ ...item, quantity: 1 }))}
                                                    whileTap={(item?.stock ?? 0) > 0 ? { scale: 0.97 } : {}}
                                                    whileHover={(item?.stock ?? 0) > 0 ? { scale: 1.01 } : {}}
                                                    disabled={(item?.stock ?? 0) === 0}
                                                    className={`w-full rounded-xl flex flex-row justify-center items-center gap-2 py-3 text-sm font-semibold transition-all duration-200 shadow-sm
                                                        ${(item?.stock ?? 0) === 0
                                                            ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                                            : 'bg-green-600 hover:bg-green-700 text-white cursor-pointer'}`}
                                                >
                                                    <ShoppingBag className='w-5 h-5' />
                                                    {(item?.stock ?? 0) === 0 ? 'Out of Stock' : 'Add to cart'}
                                                </motion.button>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                </motion.div>
                            </div>
                        </>
                    )}
                </div>

                {/* Right panel: Order Summary */}
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
                    <div className='p-4 flex flex-col gap-3 flex-1'>
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

                        {/* Cart items preview */}
                        {cartData?.length > 0 && (
                            <>
                                <div className='border-t border-dashed border-gray-100' />
                                <p className='text-xs text-gray-400 font-medium'>{cartData?.length} item{cartData?.length > 1 ? 's' : ''} in cart</p>
                                <div className='flex flex-col gap-2 max-h-40 overflow-y-auto'>
                                    {cartData?.map((ci, idx) => (
                                        <div key={ci?._id?.toString() || idx} className='flex items-center justify-between gap-2 px-2 py-1.5 bg-gray-50 rounded-lg border border-gray-100'>
                                            <div className='flex items-center gap-2 min-w-0'>
                                                <div className='relative w-8 h-8 shrink-0 rounded-lg overflow-hidden border border-gray-200'>
                                                    <Image src={ci?.image[0]} alt={ci?.name} fill className='object-cover' />
                                                </div>
                                                <span className='text-xs text-gray-700 font-medium truncate'>{ci?.name}</span>
                                            </div>
                                            <span className='text-xs font-bold text-green-700 shrink-0'>×{ci?.quantity}</span>
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>

                    {/* Footer: CTA */}
                    <div className='px-4 py-3 bg-gray-50 border-t border-gray-100 flex flex-col gap-2'>
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
                        <Link
                            href='/user/cart'
                            className='block w-full py-2 text-center text-green-700 text-sm font-semibold hover:underline'
                        >
                            View Cart ({cartData?.length})
                        </Link>
                    </div>
                </motion.div>

            </div>

            {/* Popup Image */}
            <AnimatePresence>
                {open && item?.image[0] && (
                    <PopupImage image={item?.image[0]} setOpen={setOpen} />
                )}
            </AnimatePresence>
        </section>
    )
}

export default ItemDetail
