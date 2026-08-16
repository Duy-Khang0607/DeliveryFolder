'use client'
import { Leaf, ShoppingBag, ShoppingCart, Truck } from 'lucide-react'
import Image from 'next/image'
import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useState } from 'react'
const HeroSection = () => {
    const [current, setCurrent] = useState(0)

    const slides = [
        {
            id: 1,
            icon: <ShoppingBag className='w-20 h-20 text-green-400 sm:w-28 sm:h-28 drop-shadow-lg font-bold' />,
            icon2: <ShoppingBag className='w-5 h-5 text-green-400' />,
            title: 'Shopping',
            subTitle: 'Shopping is now easier than ever with our grocery delivery service. Browse and order your favorite products with just a few clicks.',
            btnText: 'Shop Now',
            bg: 'https://www.evogennutrition.com/cdn/shop/files/Confetti_Cake-b2b-email-banner-web.jpg?v=1782662444&width=1200'
        },
        {
            id: 2,
            icon: <Leaf className='w-20 h-20 text-green-400 sm:w-28 sm:h-28 drop-shadow-lg font-bold' />,
            icon2: <Leaf className='w-5 h-5 text-green-400' />,
            title: 'Fresh Vegetables',
            subTitle: 'Fresh vegetables delivered to your door. Order now and enjoy the convenience of having your groceries delivered to your door.',
            btnText: 'Vegetables Now',
            bg: 'https://www.evogennutrition.com/cdn/shop/files/Aq-top-pump-web.jpg?v=1782665701&width=1200'
        },
        {
            id: 3,
            icon: <Truck className='w-20 h-20 text-green-400 sm:w-28 sm:h-28 drop-shadow-lg font-bold' />,
            icon2: <Truck className='w-5 h-5 text-green-400' />,
            title: 'Free Delivery',
            subTitle: 'Free delivery on all orders over $100. Order now and enjoy the convenience of having your groceries delivered to your door.',
            btnText: 'Delivery Now',
            bg: 'https://www.evogennutrition.com/cdn/shop/files/NFS-Creatine-main-banner-web.jpg?v=1785417043&width=1200'
        }
    ]

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrent(prev => (prev + 1) % (slides.length))
        }, 4000)
        return () => clearInterval(interval)
    }, [])

    return (
        <div className='w-[98%] mx-auto mt-32 h-[80vh] relative rounded-3xl overflow-hidden shadow-3xl'>
            {/* Background Image */}
            <AnimatePresence mode='wait'>
                <motion.div 
                    key={current}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.8 }} 
                    className='absolute inset-0'
                >
                    <Image src={slides[current]?.bg} alt={slides[current]?.title} fill priority sizes="100vw" className='object-cover' />
                    {/* Blur overlay */}
                    <div className='absolute inset-0 bg-black/50 blur-sm'></div>
                </motion.div>
            </AnimatePresence>

            {/* Icon - Title - Subtitle */}
            <div className='absolute inset-0 flex items-center justify-center text-center text-white'>
                <motion.div
                    initial={{ y: 30, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.6 }}
                    className='flex flex-col items-center justify-center gap-4'
                >
                    <div className='bg-white/10 p-6 rounded-full shadow-lg backdrop-blur-md'>{slides[current]?.icon}</div>
                    <h1 className='text-2xl md:text-5xl font-extrabold text-center'>{slides[current]?.title}</h1>
                    <div className='text-sm md:text-md text-center max-w-2xl'>{slides[current]?.subTitle}</div>
                    <motion.button
                        initial={{ y: 30, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ duration: 0.6 }}
                        className='bg-white/10 p-5 rounded-full shadow-lg backdrop-blur-md cursor-pointer text-green-400 font-bold hover:bg-white/20 transition-all duration-300 flex items-center justify-center gap-2'
                    >
                        {slides[current]?.icon2}
                        {slides[current]?.btnText}
                    </motion.button>
                </motion.div>
            </div>

            {/* Dots */}
            <div className='absolute bottom-5 left-1/2 -translate-x-1/2 flex items-center justify-center gap-2'>
                {slides?.map((_, index) => (
                    <button key={index} aria-label={`Go to slide ${index + 1}`} className={` h-3 rounded-full transition-all duration-300 ${current === index ? 'bg-green-400 w-5' : 'bg-white/50 w-3'}`} onClick={() => setCurrent(index)}></button>
                ))}
            </div>
        </div>
    )
}

export default HeroSection