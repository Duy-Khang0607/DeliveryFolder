'use client'
import { motion, AnimatePresence } from 'framer-motion'
import { IGrocery } from '../models/grocery.model'
import Image from 'next/image'
import { CircleMinus, CirclePlus, DollarSign, Package, ShoppingCart, Tag, Warehouse } from 'lucide-react'
import { useState } from 'react'
import PopupImage from '../HOC/PopupImage'
import { useDispatch, useSelector } from 'react-redux'
import { AppDispatch, RootState } from '../redux/store'
import { addToCart, decreaseQuantity, ICartSlice, increaseQuantity } from '../redux/cartSlice'
import Link from 'next/link'
import { useToast } from './Toast'

interface GroceryItemCardProps {
  groceries: IGrocery
}


const GroceyItemCard = ({ groceries }: GroceryItemCardProps) => {
  const [open, setOpen] = useState(false);

  const dispatch = useDispatch<AppDispatch>()

  // State redux - Cart
  const { cartData } = useSelector((state: RootState) => state?.cart as ICartSlice)

  // Find item -> khi click "Add to cart"
  const cartItem = cartData?.find(item => item?._id === groceries?._id)

  // Dùng stock từ prop (pagination), KHÔNG dùng useCartStockSync ở đây
  const stock = groceries?.stock ?? 0
  const isOut = stock === 0

  const { showToast } = useToast()

  const handleAddToCart = () => {
    if (isOut) {
      showToast('Sản phẩm đã hết hàng', 'error')
      return
    }

    dispatch(addToCart({ ...groceries, quantity: 1, stock }))
  }

  const handleIncrease = () => {
    if ((cartItem?.quantity ?? 0) >= stock) {
      showToast(`Chỉ còn ${stock} sản phẩm`, 'warning')
      return
    }
    dispatch(increaseQuantity(groceries._id.toString()))
  }

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
      <div className='p-4 flex flex-col gap-3 flex-1 min-h-[200px]'>
        {/* Header: image + category badge + name (giống avatar block của manage-users) */}
        <div className='flex flex-row gap-3 items-start w-full justify-center min-h-[80px]'>
          {/* Product image */}
          <div
            className='relative w-16 h-16 shrink-0 rounded-xl overflow-hidden border border-gray-100 shadow cursor-pointer'
            onClick={() => setOpen(true)}
          >
            {groceries?.image[0] ? (
              <Image
                src={groceries?.image[0]}
                alt={groceries?.name}
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                className='object-cover group-hover:scale-110 transition-transform duration-300'
              />
            )
              :
              (<div className='w-full h-full flex items-center justify-center bg-gray-100'>
                <Package className='w-6 h-6 text-green-400' />
              </div>)
            }
          </div>

          {/* Category badge + name */}
          <div className='flex flex-col gap-1.5 min-w-0 flex-1'>
            <span className='inline-flex items-center gap-1 w-fit px-2 py-0.5 rounded-full bg-green-50 border border-green-200 text-green-700 text-[10px] font-bold tracking-widest uppercase'>
              <Tag className='w-3 h-3 shrink-0' />
              {groceries?.category}
            </span>
            <Link href={`/user/item-detail/${groceries?._id?.toString()}`}>
              <span className='text-gray-800 text-sm font-semibold leading-snug line-clamp-2 hover:underline transition-all duration-400 cursor-pointer' title={groceries?.name}>
                {groceries?.name}
              </span>
            </Link>
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
          <div className='flex items-center gap-2'>
            <Warehouse className='w-4 h-4 text-gray-400 shrink-0' />
            <p className='text-xs text-gray-500'>Stock: <span className={`font-semibold ${isOut ? 'text-red-500' : 'text-green-500'}`}>{groceries?.stock || 0}</span></p>
          </div>
        </div>
      </div>

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
                onClick={handleIncrease}
                className={`w-5 h-5 ${(cartItem?.quantity ?? 0) >= stock
                  ? 'opacity-40 cursor-not-allowed'
                  : 'text-green-600 hover:text-green-800 cursor-pointer'
                  }`}
              />
            </div>
          </motion.div>
        ) : (
          <motion.button
            disabled={isOut}
            onClick={handleAddToCart}
            whileTap={{ scale: 0.96 }}
            whileHover={{ scale: 1.02 }}
            className={`w-full text-white rounded-xl flex flex-row justify-center items-center gap-2 py-1.5 text-xs md:text-sm font-semibold transition-all duration-200 shadow-sm ${isOut
              ? 'bg-gray-500 text-gray-400 cursor-not-allowed'
              : 'bg-green-600 hover:bg-green-700 text-white cursor-pointer'
              }`}
          >
            <ShoppingCart className='w-4 h-4' />
            {isOut ? 'Out of Stock' : 'Add to cart'}
          </motion.button>
        )}
      </div>

      {/* Popup image */}
      <AnimatePresence>
        {open && groceries?.image[0] && (
          <PopupImage image={groceries?.image[0]} setOpen={setOpen} />
        )}
      </AnimatePresence>
    </motion.div >
  )
}

export default GroceyItemCard