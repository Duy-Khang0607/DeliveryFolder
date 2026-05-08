'use client'
import { motion, AnimatePresence } from 'framer-motion'
import { IGrocery } from '../models/grocery.model'
import Image from 'next/image'
import { CircleMinus, CirclePlus, DollarSign, Eye, Package, ShoppingCart, Tag } from 'lucide-react'
import { useState } from 'react'
import PopupImage from '../HOC/PopupImage'
import { useDispatch, useSelector } from 'react-redux'
import { AppDispatch, RootState } from '../redux/store'
import { addToCart, decreaseQuantity, increaseQuantity } from '../redux/cartSlice'
import Link from 'next/link'

interface GroceryItemCardProps {
  groceries: IGrocery
}


const GroceyItemCard = ({ groceries }: GroceryItemCardProps) => {
  const [open, setOpen] = useState(false);

  const dispatch = useDispatch<AppDispatch>()

  // State redux - Cart
  const { cartData } = useSelector((state: RootState) => state.cart)

  // Find item -> khi click "Add to cart"
  const cartItem = cartData?.find(item => item?._id === groceries?._id)


  return (
    <motion.div
      className='group relative bg-white rounded-2xl border border-gray-100 shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col'
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      viewport={{ once: false, amount: 0.3 }}
    >
      {/* Top accent bar */}
      <div className='h-1 w-full bg-linear-to-r from-green-400 to-green-700' />

      {/* Body */}
      <Link href={`/user/item-detail/${groceries?._id?.toString()}`}>
        <div className='p-4 flex flex-col gap-3 flex-1 min-h-[200px]'>
          {/* Header: image + category badge + name (giống avatar block của manage-users) */}
          <div className='flex flex-row gap-3 items-start w-full justify-center min-h-[80px]'>
            {/* Product image */}
            <div
              className='relative w-16 h-16 shrink-0 rounded-xl overflow-hidden border border-gray-100 shadow cursor-pointer'
              onClick={() => setOpen(true)}
            >
              <Image
                src={groceries?.image[0]}
                alt={groceries?.name}
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                className='object-cover group-hover:scale-110 transition-transform duration-300'
              />
            </div>  

            {/* Category badge + name */}
            <div className='flex flex-col gap-1.5 min-w-0 flex-1'>
              <span className='inline-flex items-center gap-1 w-fit px-2 py-0.5 rounded-full bg-green-50 border border-green-200 text-green-700 text-[10px] font-bold tracking-widest uppercase'>
                <Tag className='w-3 h-3 shrink-0' />
                {groceries?.category}
              </span>
              <span className='text-gray-800 text-sm font-semibold leading-snug line-clamp-2' title={groceries?.name}>
                {groceries?.name}
              </span>
            </div>
          </div>

          {/* Divider */}
          <div className='border-t border-dashed border-gray-200' />

          {/* Details */}
          <div className='flex flex-col gap-2'>
            <div className='flex items-center gap-2'>
              <DollarSign className='w-4 h-4 text-gray-400 shrink-0' />
              <p className='text-sm font-extrabold text-green-700'>${groceries?.price}</p>
            </div>
            <div className='flex items-center gap-2'>
              <Package className='w-4 h-4 text-gray-400 shrink-0' />
              <p className='text-xs text-gray-500'>Unit: <span className='font-semibold text-gray-700'>{groceries?.unit || '—'}</span></p>
            </div>
          </div>
        </div>
      </Link>

      {/* Footer: Add to Cart / Quantity control */}
      <div className='px-4 pyư-3 bg-gray-50 border-t border-gray-100'>
        {cartItem ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className='w-full bg-white rounded-xl border border-green-300 py-1.5'
          >
            <div className='flex flex-row items-center justify-center gap-3'>
              <CircleMinus
                onClick={() => dispatch(decreaseQuantity(groceries?._id.toString()))}
                className='w-5 h-5 text-green-600 hover:text-green-800 cursor-pointer transition-colors'
              />
              <span className='font-bold text-sm text-green-700 min-w-[16px] text-center'>
                {cartItem?.quantity}
              </span>
              <CirclePlus
                onClick={() => dispatch(increaseQuantity(groceries?._id.toString()))}
                className='w-5 h-5 text-green-600 hover:text-green-800 cursor-pointer transition-colors'
              />
            </div>
          </motion.div>
        ) : (
          <motion.button
            onClick={() => dispatch(addToCart({ ...groceries, quantity: 1 }))}
            whileTap={{ scale: 0.96 }}
            whileHover={{ scale: 1.02 }}
            className='w-full bg-green-600 hover:bg-green-700 text-white rounded-xl flex flex-row justify-center items-center gap-2 py-1.5 text-xs md:text-sm font-semibold transition-all duration-200 cursor-pointer shadow-sm'
          >
            <ShoppingCart className='w-4 h-4' />
            Add to cart
          </motion.button>
        )}
      </div>

      {/* Popup image */}
      <AnimatePresence>
        {open && groceries?.image[0] && (
          <PopupImage image={groceries?.image[0]} setOpen={setOpen} />
        )}
      </AnimatePresence>
    </motion.div>
  )
}

export default GroceyItemCard