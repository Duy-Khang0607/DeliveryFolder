'use client'
import { AnimatePresence, motion } from 'framer-motion'
import { IGrocery } from '../models/grocery.model'
import CategorySilder from './CategorySilder'
import GroceryItemCard from './GroceryItemCard'
import { useEffect, useState } from 'react'
import Pagination from './Pagination'
import { useSearchParams } from 'next/navigation'
import { useGroceryPaginatedUser } from '../hooks/useGroceryPaginated'
import { Loader2 } from 'lucide-react'

const GrocerySection = () => {
    const [selectedCategory, setSelectedCategory] = useState<string>('')

    // Tanstack query
    const [currentPage, setCurrentPage] = useState(1);
    const searchParams = useSearchParams()
    const q = searchParams.get('q') || ''
    const { data, isFetching } = useGroceryPaginatedUser(currentPage, q, selectedCategory || undefined)
    const groceries = data?.groceries ?? []
    const totalPages = data?.pagination?.totalPages ?? 1
    const totalItems = data?.pagination?.totalItems ?? 0

    useEffect(() => {
        setCurrentPage(1)
    }, [q])

    const handleSelectCategory = (category: string) => {
        setCurrentPage(1)
        setSelectedCategory(category)
    }

    const handlePrevPage = () => {
        if (currentPage > 1) {
            setCurrentPage(prev => prev - 1)
        }
    }

    const handleNextPage = () => {
        if (currentPage < totalPages) {
            setCurrentPage(prev => prev + 1)
        }
    }

    return (
        <>
            <CategorySilder selectedCategory={selectedCategory} onSelectCategory={handleSelectCategory} />

            {/* Grocery List Items */}
            <div className='w-[90%] md:w-[80%] mt-10 mx-auto'>
                {/* Title */}
                <h2 className='text-green-700 font-extrabold text-3xl tracking-wide text-center'>Popular Grocery Items</h2>

                {/* Grocery Items */}
                {isFetching ? (
                    <div className='w-full h-full flex items-center justify-center py-20'>
                        <Loader2 className='animate-spin w-15 h-15 md:w-20 md:h-20 text-green-700' />
                    </div>
                ) : (
                    <div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6 mt-10 w-full'>
                        <AnimatePresence mode='popLayout' initial={false} key={selectedCategory}>
                            {groceries?.length > 0 ? (
                                groceries?.map((item: IGrocery) => (
                                    <GroceryItemCard key={item?._id.toString()} groceries={item} />
                                ))
                            ) : (
                                <motion.div
                                    key='no-items'
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.4 }}
                                    className='w-full h-full'>
                                    <p className='text-gray-500 text-sm md:text-md font-semibold'>No groceries items found for this category</p>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                )}


                {/* Pagination */}
                {totalItems > 0 && (
                    <Pagination totalPages={totalPages} handlePrevPage={handlePrevPage} handleNextPage={handleNextPage} currentPage={currentPage} setCurrentPage={setCurrentPage} />
                )}
            </div>
        </>
    )
}

export default GrocerySection