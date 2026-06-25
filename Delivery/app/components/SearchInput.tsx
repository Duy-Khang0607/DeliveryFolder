'use client'
import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useDebounce } from '../hooks/useDebounce'
import { Search } from 'lucide-react'

const SearchInput = ({ onSearch, placeholder }: { onSearch: (search: string) => void, placeholder?: string }) => {
    const [search, setSearch] = useState('')
    const debouncedSearch = useDebounce(search, 500)



    useEffect(() => {
        onSearch(debouncedSearch)
    }, [debouncedSearch])

    return (
        <motion.form
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className='w-full h-full flex flex-row justify-center items-center'
            onSubmit={(e) => e.preventDefault()}
        >
            <div className='relative w-full max-w-lg'>
                <input
                    type="text"
                    id='search'
                    placeholder={placeholder}
                    className='w-full h-full rounded-md p-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500 pr-10'
                    value={search}
                    onChange={(e) => {
                        setSearch(e.target.value);
                    }}
                />
                <motion.button
                    type='submit'
                    whileTap={{ scale: 0.97 }}
                    whileHover={{ scale: 1.06 }}
                    className='absolute right-0 top-0 bg-green-700 text-white rounded-r-md p-2 hover:bg-green-800 cursor-pointer transition-all duration-200 w-auto h-full'

                >
                    <Search className='w-5 h-5' />
                </motion.button>
            </div>
        </motion.form>
    )
}

export default SearchInput