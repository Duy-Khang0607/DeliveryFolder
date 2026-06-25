// 'use client'
// import React, { useState } from 'react'
// import { motion } from 'framer-motion'

// const CanncelOrder = () => {
//     const [showConfirmCancel, setShowConfirmCancel] = useState(false)

//     const handleCancel = () => {
//         console.log('cancel')
//     }
//     return (
//         <motion.div
//             initial={{ opacity: 0, scale: 0.95 }}
//             animate={{ opacity: 1, scale: 1 }}
//             className='absolute inset-0 bg-white/95 backdrop-blur-sm rounded-2xl flex flex-col items-center justify-center gap-3 p-6 z-10'
//         >
//             <p className='font-bold text-gray-800 text-center'>Cancel this order?</p>
//             <p className='text-xs text-gray-400 text-center'>Order #{orders._id.slice(-6)} will be cancelled.</p>
//             <div className='flex gap-3 w-full'>
//                 <button onClick={() => setShowConfirmCancel(false)}
//                     className='flex-1 py-2 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600'>
//                     Keep Order
//                 </button>
//                 <button onClick={handleCancel}
//                     className='flex-1 py-2 rounded-xl bg-red-500 text-white text-sm font-semibold'>
//                     Yes, Cancel
//                 </button>
//             </div>
//         </motion.div>
//     )
// }

// export default CanncelOrder