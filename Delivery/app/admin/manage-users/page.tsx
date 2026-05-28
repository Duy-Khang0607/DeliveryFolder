'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import axios from 'axios'
import { Box, Edit, MailIcon, Phone, Search, Shield, Trash2, Truck, User, UserPlus, Wifi, WifiOff } from 'lucide-react'
import Image from 'next/image'
import ButtonHome from '@/app/components/ButtonHome'
import { useToast } from '@/app/components/Toast'
import PopupImage from '@/app/HOC/PopupImage'
import Link from 'next/link'
import { IUser } from '@/app/models/user.model'
import profileImage from '@/app/assets/profile.jpg'
import FormEditUser from '@/app/components/FormEditUser'
import Pagination from '@/app/components/Pagination'
import { getSocket } from '@/app/lib/socket'
import { useUsersPaginated } from '@/app/hooks/useUsersPaginated'
import { useQueryClient } from '@tanstack/react-query'

const ROLE_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
    user: { label: 'User', color: 'bg-blue-50 text-blue-700 border border-blue-200', icon: <User className='w-3 h-3' /> },
    admin: { label: 'Admin', color: 'bg-purple-50 text-purple-700 border border-purple-200', icon: <Shield className='w-3 h-3' /> },
    deliveryBoy: { label: 'Delivery', color: 'bg-orange-50 text-orange-700 border border-orange-200', icon: <Truck className='w-3 h-3' /> },
}

const ManageUsers = () => {
    const [search, setSearch] = useState<string>('')
    const [isEdit, setEdit] = useState<boolean>(false)
    const [editItem, setEditItem] = useState<IUser | null>(null)
    const [open, setOpen] = useState(false)
    const [currentPage, setCurrentPage] = useState(1);
    const { showToast } = useToast();
    const [searchQuery, setSearchQuery] = useState('')
    const [isSearch, setIsSearch] = useState<boolean>(false)

    // tanstack query
    const queryClient = useQueryClient()
    const { data, isLoading, isFetching } = useUsersPaginated(currentPage, searchQuery)
    const users = data?.users as IUser[] ?? []
    const totalPages = data?.pagination?.totalPages ?? 1
    const totalItems = data?.pagination?.totalItems ?? 0


    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this user?')) return
        try {
            const res = await axios.delete(`/api/auth/admin/delete-user`, { data: { id: id } })
            if (res?.data?.success) {
                showToast(res?.data?.message, "success");
                queryClient.invalidateQueries({ queryKey: ['users'] })
            } else {
                showToast(res?.data?.message, "error");
            }
        } catch (error: any) {
            showToast(`${error?.response?.data?.message || 'Delete user failed !'}`, "error");
        }
    }

    const handleSearchGrocery = async (e: React.FormEvent<HTMLFormElement>) => {
        try {
            setIsSearch(true)
            e.preventDefault()
            setSearchQuery(search)  // TanStack tự fetch lại với q=search
            setCurrentPage(1)       // reset về page 1 khi search mới
            setIsSearch(false)
        } catch (error) {
            setIsSearch(false)
        }
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

    const handleUserStatusUpdated = (data: { userId: string, isOnline: boolean }) => {
        queryClient.invalidateQueries({ queryKey: ['users', 'pagination'] })

        const { userId, isOnline } = data

        const idUser = userId.toString().slice(-6)

        if (data) showToast(`User ${idUser} ${isOnline ? 'Online' : 'Offline'}`, isOnline ? 'success' : 'warning')

    }

    useEffect(() => {
        // Lắng nghe socket khi user offline
        const socket = getSocket()

        socket.on('user-status-updated', handleUserStatusUpdated)

        return () => { socket.off('user-status-updated', handleUserStatusUpdated) }
    }, [])

    return (
        <>
            {isLoading || isSearch ? (
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
                        {users?.length > 0 ? (
                            <>
                                <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 py-5 w-full'>
                                    {users?.map((item: IUser, index: number) => {
                                        const roleConfig = ROLE_CONFIG[item?.role || 'user']
                                        return (
                                            <motion.div
                                                key={index}
                                                initial={{ opacity: 0, y: 12 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ duration: 0.35, delay: index * 0.04 }}
                                                className='group relative bg-white rounded-2xl border border-gray-100 shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col'
                                            >
                                                {/* Top accent bar theo role */}
                                                <div className={`h-1 w-full ${item?.role === 'admin' ? 'bg-purple-400' : item?.role === 'deliveryBoy' ? 'bg-orange-400' : 'bg-blue-400'}`} />

                                                <div className='p-4 flex flex-col gap-3 flex-1'>
                                                    {/* Header: avatar + info */}
                                                    <div className='flex flex-row gap-3 items-start'>
                                                        {/* Avatar + online dot */}
                                                        <div className='relative shrink-0'>
                                                            <Image
                                                                onClick={() => { setOpen(true); setEditItem(item) }}
                                                                src={item?.image || profileImage}
                                                                alt={item?.name}
                                                                width={64}
                                                                height={64}
                                                                className='w-16 h-16 object-cover rounded-xl border-2 border-gray-100 shadow cursor-pointer'
                                                            />
                                                            <span className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${item?.isOnline ? 'bg-green-500' : 'bg-gray-300'}`} />
                                                        </div>

                                                        {/* Name + role + status */}
                                                        <div className='flex flex-col gap-1.5 min-w-0 flex-1'>
                                                            <div className='flex items-center gap-2 flex-wrap'>
                                                                <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${roleConfig?.color}`}>
                                                                    {roleConfig?.icon}
                                                                    {roleConfig?.label}
                                                                </span>
                                                                <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border ${item?.isOnline ? 'bg-green-50 text-green-700 border-green-200' : 'bg-gray-50 text-gray-500 border-gray-200'}`}>
                                                                    {item?.isOnline ? <Wifi className='w-3 h-3' /> : <WifiOff className='w-3 h-3' />}
                                                                    {item?.isOnline ? 'Online' : 'Offline'}
                                                                </span>
                                                            </div>
                                                            <h2 className='font-bold text-gray-800 text-sm leading-tight truncate'>{item?.name}</h2>
                                                        </div>
                                                    </div>

                                                    {/* Divider */}
                                                    <div className='border-t border-dashed border-gray-100' />

                                                    {/* Contact info */}
                                                    <div className='flex flex-col gap-2'>
                                                        <div className='flex items-start gap-2 min-w-0'>
                                                            <MailIcon className='w-4 h-4 text-gray-400 shrink-0 mt-0.5' />
                                                            <p className='text-xs text-gray-500 break-all leading-relaxed'>{item?.email}</p>
                                                        </div>
                                                        <div className='flex items-center gap-2'>
                                                            <Phone className='w-4 h-4 text-gray-400 shrink-0' />
                                                            <p className='text-xs text-gray-500'>{item?.mobile || '—'}</p>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Footer actions */}
                                                <div className='px-4 py-3 bg-gray-50 border-t border-gray-100 flex flex-row items-center justify-between gap-2'>
                                                    <span className='text-xs text-gray-400 font-mono'>#{item?._id?.toString().slice(-6)}</span>
                                                    <div className='flex items-center gap-2'>
                                                        <motion.button
                                                            whileTap={{ scale: 0.95 }}
                                                            whileHover={{ scale: 1.08 }}
                                                            className='bg-green-600 hover:bg-green-700 text-white rounded-lg p-1.5 transition-all'
                                                            onClick={() => { setEdit(true); setEditItem(item) }}
                                                        >
                                                            <Edit className='w-4 h-4' />
                                                        </motion.button>
                                                        <motion.button
                                                            whileTap={{ scale: 0.95 }}
                                                            whileHover={{ scale: 1.08 }}
                                                            onClick={() => handleDelete(item?._id?.toString() || '')}
                                                            className='bg-red-500 hover:bg-red-600 text-white rounded-lg p-1.5 transition-all'
                                                        >
                                                            <Trash2 className='w-4 h-4' />
                                                        </motion.button>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        )
                                    })}
                                </div>

                                {/* Total items */}
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.4 }}
                                    className='w-full flex flex-row justify-between items-center gap-2 ml-2 pb-20'
                                >
                                    <span className='text-sm text-gray-400 font-semibold'>
                                        Page <span className='text-green-700 font-extrabold'>{currentPage}</span> · <span className='text-green-700 font-extrabold'>{totalItems}</span> users total
                                    </span>
                                </motion.div>
                            </>
                        ) : (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.4 }}
                                className='w-full h-full flex flex-col items-center justify-center py-20 gap-2'
                            >
                                <User className='w-12 h-12 text-gray-300' />
                                <p className='text-lg font-bold text-gray-400'>No users found</p>
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
                            <FormEditUser isEdit={isEdit} title="Edit User" description="Edit a user in your system." setEdit={setEdit} editItem={editItem} fetchUsers={() => queryClient.invalidateQueries({ queryKey: ['users'] })} />
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