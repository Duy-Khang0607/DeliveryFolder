'use client'
import { motion } from 'framer-motion'
import { ArrowLeft, ArrowRight } from 'lucide-react'


interface PaginationProps {
    totalPages: number
    handlePrevPage: () => void
    handleNextPage: () => void
    currentPage: number
    setCurrentPage: (page: number) => void
}

const Pagination = ({ totalPages, handlePrevPage, handleNextPage, currentPage, setCurrentPage }: PaginationProps) => {
    return (
        <>
            <div className='fixed left-1/2 -translate-x-1/2 bottom-2 md:bottom-0 flex flex-row justify-center items-center z-50 bg-white/50 backdrop-blur-sm rounded-full p-2 border border-gray-300'>
                {/* Prev Page */}
                {totalPages > 1 && currentPage > 1 && (
                    <motion.button
                        whileTap={{ scale: 0.97 }}
                        whileHover={{ scale: 1.06 }}
                        onClick={handlePrevPage}
                        disabled={currentPage === 1}
                        className={`rounded-full p-1 transition-all duration-200 w-6 h-6 flex justify-center items-center ${currentPage === 1 ? 'bg-gray-500 text-white cursor-not-allowed' : 'bg-green-700 text-white cursor-pointer hover:bg-green-800'}`}
                    >
                        <ArrowLeft className='w-5 h-5' />
                    </motion.button>
                )}
                {/* Show pages 1, 2, 3, 4, 5 */}
                {totalPages > 5 ? (
                    <>
                        {/* Luôn có page 1 */}
                        <motion.button
                            onClick={() => { if (1 !== currentPage) setCurrentPage(1) }}
                            className={`${currentPage === 1
                                ? 'bg-green-700 text-white'
                                : 'bg-white text-green-700 border border-green-700'
                                } rounded-full hover:bg-green-800 hover:text-white cursor-pointer w-8 h-8 font-bold flex justify-center items-center mx-1`}
                        >
                            <span className='text-sm w-full text-center'>1</span>
                        </motion.button>

                        {/* "..." khi currentPage > 2 */}
                        {currentPage > 2 && (
                            <span className="mx-1 text-gray-500 font-bold select-none">...</span>
                        )}

                        {/* currentPage ở giữa (chỉ khi không phải page 1 hoặc cuối) */}
                        {currentPage !== 1 && currentPage !== totalPages && (
                            <motion.button className='bg-green-700 text-white rounded-full w-8 h-8 font-bold flex justify-center items-center mx-1'>
                                <span className='text-sm w-full text-center'>{currentPage}</span>
                            </motion.button>
                        )}

                        {/* "..." khi currentPage < totalPages - 1 */}
                        {currentPage < totalPages - 1 && (
                            <span className="mx-1 text-gray-500 font-bold select-none">...</span>
                        )}
                        
                        {/* Luôn có page cuối */}
                        <motion.button
                            onClick={() => { if (totalPages !== currentPage) setCurrentPage(totalPages) }}
                            className={`${currentPage === totalPages
                                ? 'bg-green-700 text-white'
                                : 'bg-white text-green-700 border border-green-700'
                                } rounded-full hover:bg-green-800 hover:text-white cursor-pointer w-8 h-8 font-bold flex justify-center items-center mx-1`}
                        >
                            <span className='text-sm w-full text-center'>{totalPages}</span>
                        </motion.button>
                    </>
                ) : (
                    Array.from({ length: totalPages }, (_, i) => {
                        const pageNum = i + 1;
                        return (
                            <motion.button
                                key={pageNum}
                                whileTap={{ scale: 0.97 }}
                                whileHover={{ scale: 1.06 }}
                                onClick={() => {
                                    if (pageNum !== currentPage) setCurrentPage(pageNum)
                                }}
                                className={`${pageNum === currentPage
                                    ? 'bg-green-700 text-white'
                                    : 'bg-white text-green-700 border border-green-700'
                                    } rounded-full hover:bg-green-800 hover:text-white cursor-pointer transition-all duration-200 w-6 h-6 font-bold flex justify-center items-center mx-1`}
                            >
                                <span className='text-xs md:text-xm w-full text-center'>{pageNum}</span>
                            </motion.button>
                        );
                    })
                )}
                {/* Next Page */}
                {totalPages > 1 && currentPage < totalPages && (
                    <motion.button
                        whileTap={{ scale: 0.97 }}
                        whileHover={{ scale: 1.06 }}
                        onClick={handleNextPage}
                        disabled={currentPage === totalPages}
                        className={`rounded-full p-1 transition-all duration-200 w-6 h-6 flex justify-center items-center ${currentPage === totalPages ? 'bg-gray-500 text-white cursor-not-allowed' : 'bg-green-700 text-white cursor-pointer hover:bg-green-800'}`}
                    >
                        <ArrowRight className='w-5 h-5' />
                    </motion.button>
                )}
            </div>
        </>
    )
}

export default Pagination