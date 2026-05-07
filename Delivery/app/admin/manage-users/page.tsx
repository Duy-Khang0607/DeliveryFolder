'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import axios from 'axios'
import { Box, Edit, MailIcon, Phone, Search, Trash2, UserPlus } from 'lucide-react'
import Image from 'next/image'
import ButtonHome from '@/app/components/ButtonHome'
import { useToast } from '@/app/components/Toast'
import PopupImage from '@/app/HOC/PopupImage'
import Link from 'next/link'
import { IUser } from '@/app/models/user.model'
import profileImage from '@/app/assets/profile.jpg'
import FormEditUser from '@/app/components/FormEditUser'
import Pagination from '@/app/components/Pagination'

const ManageUsers = () => {
    const [loading, setLoading] = useState(false)
    const [users, setUsers] = useState<IUser[]>([])
    const [search, setSearch] = useState<string>('')
    const [filter, setFilter] = useState<IUser[]>([])
    const [isEdit, setEdit] = useState<boolean>(false)
    const [editItem, setEditItem] = useState<IUser | null>(null)
    const [open, setOpen] = useState(false)
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const itemsPerPage = 10
    const { showToast } = useToast();

    const fetchUsers = async (page: number = 1) => {
        try {
            setLoading(true)
            const res = await axios.get(`/api/auth/admin/get-users?page=${page}&limit=${itemsPerPage}`)
            if (res?.data?.success) {
                setUsers(res?.data?.users)
                setFilter(res?.data?.users)
                setTotalPages(res?.data?.pagination?.totalPages)
                setTotalItems(res?.data?.pagination?.totalItems || 0)
            }
        } catch (error: any) {
            showToast(`${error?.response?.data?.message || 'System error !'}`, "error");
        } finally {
            setLoading(false)
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this user?')) return
        try {
            const res = await axios.delete(`/api/auth/admin/delete-user`, { data: { id: id } })
            if (res?.data?.success) {
                showToast(res?.data?.message, "success");
                await fetchUsers(currentPage)
            } else {
                showToast(res?.data?.message, "error");
            }
        } catch (error: any) {
            showToast(`${error?.response?.data?.message || 'Delete user failed !'}`, "error");
        }
    }

    const handleSearchGrocery = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        const value = search.toLowerCase()

        setFilter(users?.filter((item: IUser) => item?.name?.toLowerCase()?.includes(value) || item?.email?.toLowerCase()?.includes(value) || item?.mobile?.toLowerCase()?.includes(value)))
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

    useEffect(() => {
        fetchUsers(currentPage)
    }, [currentPage])

    return (
        <>
            {loading ? (
                <motion.div
                    initial={{ y: 40, opacity: 0 }}
                    animate={{ y: [0, -10, 0], opacity: 1 }}
                    transition={{
                        delay: 0.2,
                        duration: 3,
                        repeat: Infinity,
                        ease: "easeInOut"
                    }}
                    className='flex flex-col items-center justify-center min-h-screen'
                >
                    <Box className='w-25 h-25 md:w-50 md:h-50 text-green-700 mb-5' />
                </motion.div>
            ) : (
                <>
                    <motion.div className='w-[90%] sm:w-[85%] md:w-[80%] mx-auto h-full pt-10'>
                        {/* Back to home */}
                        <div className='min-h-[40px] flex items-center justify-between'>
                            <div>
                                <ButtonHome />
                            </div>

                            <div>
                                <Link
                                    href="/admin/add-user"
                                    className="md:flex hidden items-center gap-1 px-3 py-1.5 rounded-xl bg-green-50 border border-green-200 text-green-800 hover:bg-green-100 transition-all font-semibold shadow hover:shadow-lg text-sm"
                                >
                                    <UserPlus className="w-4 h-4" />
                                    <span className="hidden md:inline">Add User</span>
                                </Link>
                            </div>
                        </div>

                        {/* Search */}
                        <motion.form
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.4 }}
                            className='w-full h-full flex flex-row justify-center items-center'
                            onSubmit={handleSearchGrocery}
                        >
                            <div className='relative w-full max-w-lg'>
                                <input
                                    type="text"
                                    id='search'
                                    placeholder='Search for a user'
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

                        {/* Users */}
                        {filter?.length > 0 ? (
                            <>
                                <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 gap-4 py-5 w-full'>
                                    {filter?.map((item: IUser, index: number) => {
                                        return (
                                            <motion.div
                                                key={index}
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ duration: 0.4 }}
                                                className='w-full h-full flex flex-row flex-wrap justify-between items-center px-4 py-5 rounded-2xl shadow-xl border border-gray-200 bg-white gap-4 hover:shadow-2xl transition-all duration-200 cursor-pointer overflow-hidden relative'
                                            >
                                                <div className='flex flex-row gap-4 items-center w-full'>
                                                    {/* Image && Online*/}
                                                    <div className='flex flex-col gap-2 items-center justify-center'>
                                                        <Image onClick={() => {
                                                            setOpen(true)
                                                            setEditItem(item)
                                                        }} src={item?.image || profileImage} alt={item?.name} width={100} height={100} className='w-20 h-[100px] object-cover rounded-xl border border-gray-300 shadow-md shadow-gray-300 cursor-pointer' />
                                                        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className={`${item?.isOnline ? 'bg-green-500 text-white' : 'bg-red-500 text-white'} px-2 py-1 rounded-md`}>{item?.isOnline ? "Online" : "Offline"}</motion.button>
                                                    </div>

                                                    <div className='flex flex-col items-start gap-2'>
                                                        <div className={`${item?.role === 'admin' ? 'bg-purple-100 text-purple-700 border-purple-300' : item?.role === 'deliveryBoy' ? 'bg-orange-100 text-orange-700 border-orange-300' : 'bg-blue-100 text-blue-700 border-blue-300'} px-2 py-1 rounded-md text-sm font-bold`}>
                                                            <p>{item?.role?.toUpperCase()}</p>
                                                        </div>
                                                        <h2 className='text-sm md:text-md xl:text-lg font-extrabold text-green-700'>{item?.name}</h2>
                                                        <div className='flex flex-row items-center gap-2 w-full'>
                                                            <MailIcon className='w-5 h-5 text-gray-500' />
                                                            <p className='text-sm md:text-base text-gray-500'>{item?.email}</p>
                                                        </div>
                                                        <div className='flex flex-row items-center gap-2'>
                                                            <Phone className='w-5 h-5 text-gray-500' />
                                                            <p className='text-sm md:text-base text-gray-500'>{item?.mobile}</p>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className='flex flex-col md:flex-row items-center gap-2 w-auto'>
                                                    <motion.button
                                                        whileTap={{ scale: 0.97 }}
                                                        whileHover={{ scale: 1.06 }}
                                                        className='bg-green-700 text-white rounded-md p-2 hover:bg-green-800 cursor-pointer transition-all duration-200 w-auto h-auto'
                                                        onClick={() => {
                                                            setEdit(true)
                                                            setEditItem(item)
                                                        }}
                                                    >
                                                        <Edit className='w-5 h-5' />
                                                    </motion.button>
                                                    <motion.button
                                                        whileTap={{ scale: 0.97 }}
                                                        whileHover={{ scale: 1.06 }}
                                                        onClick={() => handleDelete(item?._id?.toString() || '')}
                                                        className='bg-red-500 text-white rounded-md p-2 hover:bg-red-800 cursor-pointer transition-all duration-200 w-auto h-auto'
                                                    >
                                                        <Trash2 className='w-5 h-5' />
                                                    </motion.button>
                                                </div>
                                            </motion.div>
                                        )
                                    }
                                    )}
                                </div>

                                {/* Total items */}
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.4 }}
                                    className='w-full h-full flex flex-row justify-between items-center gap-2 ml-2'
                                >
                                    <span className='text-sm md:text-base text-gray-500 font-bold'>Pages of items: {" "}
                                        <span className='text-sm md:text-base text-green-700 font-extrabold'>{currentPage} of {totalItems}</span>
                                    </span>
                                </motion.div>
                            </>
                        ) : (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.4 }}
                                className='w-full h-full flex flex-col items-center justify-center'
                            >
                                <p className='text-lg md:text-2xl font-extrabold text-gray-500'>No users found</p>
                            </motion.div>
                        )}
                    </motion.div>

                    {/* Pagination */}
                    {totalItems > 0 && (
                        <Pagination totalPages={totalPages} handlePrevPage={handlePrevPage} handleNextPage={handleNextPage} currentPage={currentPage} setCurrentPage={setCurrentPage} />
                    )}

                    {/* Edit User */}
                    <AnimatePresence mode='wait' onExitComplete={() => setEdit(false)}>
                        {isEdit && (
                            <FormEditUser isEdit={isEdit} title="Edit User" description="Edit a user in your system." setEdit={setEdit} editItem={editItem} fetchUsers={fetchUsers} />
                        )}
                    </AnimatePresence>

                    {/*Popup image*/}
                    <AnimatePresence mode='popLayout'>
                        {open && editItem?.image && (
                            <PopupImage image={editItem?.image || ''} setOpen={setOpen} />
                        )}
                    </AnimatePresence>
                </>
            )}
        </>
    )
}

export default ManageUsers