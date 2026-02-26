'use client'
import { AnimatePresence, motion } from 'motion/react'
import { IGrocery } from '../models/grocery.model'
import CategorySilder from './CategorySilder'
import GroceryItemCard from './GroceryItemCard'
import { useEffect, useState } from 'react'

const GrocerySection = ({ groceryList }: { groceryList: IGrocery[] }) => {

    const [selectedCategory, setSelectedCategory] = useState<string>('')
    const [filteredGroceryList, setFilteredGroceryList] = useState<IGrocery[]>(groceryList)

    useEffect(() => {
        if (selectedCategory === '') {
            setFilteredGroceryList(groceryList)
        } else {
            setFilteredGroceryList(groceryList?.filter((item: IGrocery) => item?.category === selectedCategory))
        }
    }, [selectedCategory, groceryList])

    return (
        <>
            <CategorySilder selectedCategory={selectedCategory} onSelectCategory={setSelectedCategory} />
            {/* Grocery List Items */}
            <div className='w-[90%] md:w-[80%] mt-10 mx-auto'>
                {/* Title */}
                <h1 className='text-green-700 font-extrabold text-3xl tracking-wide text-center'>Popular Grocery Items</h1>
                {/* Grocery Items */}
                <div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6 mt-10 w-full'>
                    <AnimatePresence mode='popLayout' initial={false} key={selectedCategory}>
                        {filteredGroceryList?.length > 0 ? (
                            filteredGroceryList?.map((item: IGrocery) => (
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
            </div>
        </>
    )
}

export default GrocerySection