'use client'
import { CircleX, LogOut, Menu, Package, PackagePlus, Search, ShoppingCart, User, UserCog, Users, X } from 'lucide-react'
import { IUser } from '../models/user.model'
import Link from 'next/link'
import Image from 'next/image'
import { FormEvent, useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { signOut } from 'next-auth/react'
import { useSelector } from 'react-redux'
import { RootState } from '../redux/store'
import { useRouter } from 'next/navigation'
import axios from 'axios'
import profileImage from '../assets/profile.jpg'
import deliveryBoyImage from '../assets/deliveryBoy.png'
import { useToast } from './Toast'
import FormEditUser from './FormEditUser'
import { disconnectSocket, getSocket } from '../lib/socket'

const Nav = ({ user }: { user: IUser }) => {
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [showSearchMobile, setShowSearchMobile] = useState(false)
  const [search, setSearch] = useState('')
  const profileDropDown = useRef<HTMLButtonElement>(null)
  const avatarRef = useRef<HTMLDivElement>(null)
  const iconSearchRef = useRef<HTMLDivElement>(null)
  const searchMobileRef = useRef<HTMLFormElement>(null)
  const [sideBar, setSideBar] = useState(false)
  const router = useRouter()
  const [userOrdersCount, setUserOrdersCount] = useState(0)
  const [pendingOrdersCount, setPendingOrdersCount] = useState(0)
  const { cartData } = useSelector((state: RootState) => state?.cart)
  const { userData } = useSelector((state: RootState) => state?.user)
  const { showToast } = useToast()
  const [isEdit, setEdit] = useState<boolean>(false)
  const [editItem, setEditItem] = useState<IUser | null>(null)


  const handleSearch = (e: FormEvent) => {
    e.preventDefault();
    try {
      const q = search?.trim();

      if (!q) {
        return router.push(`/`)
      }

      router.push(`/?q=${encodeURIComponent(q)}`)

      setShowSearchMobile(false)
    } catch (error) {
      return error
    }
  }

  const fetchUserOrders = async () => {
    try {
      const res = await axios.get('/api/auth/user/my-orders?page=1&limit=10')
      setUserOrdersCount(res?.data?.pagination?.totalItems || 0)
    } catch (error: any) {
      showToast(error?.response?.data?.message, 'error')
    }
  }

  const fetchAdminPendingOrders = async () => {
    try {
      const res = await axios.get('/api/auth/admin/get-orders?page=1&limit=1&status=Pending')
      setPendingOrdersCount(res?.data?.pagination?.totalItems || 0)
    } catch (error: any) {
      showToast(error?.response?.data?.message, 'error')
    }
  }

  const fetchUsers = () => {
    router.refresh()
  }

  const handleEditUser = () => {
    setEditItem(userData)
    setEdit(true)
  }

  useEffect(() => {
    if (user?.role === 'user') {
      fetchUserOrders()
    } else if (user?.role === 'admin') {
      fetchAdminPendingOrders()
    }
  }, [user?.role])

  useEffect(() => {
    if (user?.role !== 'admin') return

    const socket = getSocket()

    const handleNewOrder = (order?: { status?: string }) => {
      if (!order?.status || order.status === 'Pending') {
        setPendingOrdersCount((prev) => prev + 1)
      }
    }

    const handlePendingCountRefresh = () => {
      fetchAdminPendingOrders()
    }

    socket?.on('new-order', handleNewOrder)
    socket?.on('order-status-updated', handlePendingCountRefresh)
    socket?.on('order-assigned', handlePendingCountRefresh)

    return () => {
      socket?.off('new-order', handleNewOrder)
      socket?.off('order-status-updated', handlePendingCountRefresh)
      socket?.off('order-assigned', handlePendingCountRefresh)
    }
  }, [user?.role])

  // Tắt dropdown Profile khi click ra ngoài
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node

      // Dropdown Profile
      const isInsideDropdown = profileDropDown.current?.contains(target)
      const isInsideAvatar = avatarRef.current?.contains(target)

      if (showUserMenu && !isInsideDropdown && !isInsideAvatar) {
        setShowUserMenu(false)
      }

      // Search mobile
      const isInsideSearch = searchMobileRef.current?.contains(target)
      const isInsideIconSearch = iconSearchRef.current?.contains(target)
      if (showSearchMobile && !isInsideSearch && !isInsideIconSearch) {
        setShowSearchMobile(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showUserMenu, showSearchMobile])

  return (
    <nav className='max-w-[90%] mx-auto h-16 shadow-md flex items-center justify-between px-4 text-white mt-4 rounded-md bg-green-500 fixed top-0 left-0 right-0 z-99'>
      {/* Title */}
      <div className='text-white text-xl font-bold max-w-full'>
        <Link href='/' className='hover:text-gray-300 transition-all duration-300'>
          <Image src={deliveryBoyImage} alt='Delivery' width={50} height={50} className='object-cover rounded-full' />
        </Link>
      </div>

      {/* Search */}
      {user?.role === 'user' && <>
        <form className='hidden md:flex items-center rounded-md w-1/2 md:w-1/3 bg-white max-w-lg shadow-md' onSubmit={handleSearch}>
          <Search className='w-5 h-5 ml-2 text-black' />
          <input type="text" id="search" placeholder='Search for a product' className='w-full outline-none text-gray-700 placeholder:text-gray-400 p-3 focus:outline-none  focus:ring-green-500' value={search} onChange={(e) => setSearch(e.target.value)} />
        </form>
      </>}

      {/* Cart && User */}
      <div className='flex flex-row items-center gap-3'>

        {/* Icon search mobile */}
        {user?.role === 'user' && <>
          <div ref={iconSearchRef} className='relative bg-white rounded-full p-2 cursor-pointer md:hidden' onClick={() => setShowSearchMobile((prev) => !prev)}>
            <Search className='w-5 h-5 text-green-500' />
          </div>
        </>}

        {/* Cart Icon */}
        {user?.role === 'user' && <>
          <Link href='/user/cart' className='relative bg-white rounded-full p-2'>
            <ShoppingCart className='w-5 h-5 text-green-500' />
            <span className='absolute -top-1.5 -right-2 text-white font-bold text-sm flex items-center justify-center w-5 h-5 bg-red-500 rounded-full'>{cartData?.length}</span>
          </Link>
        </>}

        {/* Icon menu admin mobile  */}
        {user?.role === 'admin' && (
          <div className='relative bg-white rounded-full p-2 md:hidden' onClick={() => setSideBar(prev => !prev)}>
            <Menu className='w-5 h-5 text-green-500' />
          </div>
        )}

        {/* Menu admin  */}
        {user?.role === 'admin' && (
          <div className='hidden md:flex flex-row gap-4 items-center w-full'>

            {/* View Coupons */}
            <Link href='admin/manage-coupons' className='flex items-center gap-1.5 bg-white text-green-700 font-semibold p-2 rounded-full hover:bg-green-100 transition-all duration-300 w-full text-sm'>
              <PackagePlus className='w-5 h-5 text-green-500' />
              Coupons
            </Link>

            {/* View Category */}
            <Link href='admin/view-categories' className='flex items-center gap-1.5 bg-white text-green-700 font-semibold p-2 rounded-full hover:bg-green-100 transition-all duration-300 w-full text-sm'>
              <PackagePlus className='w-5 h-5 text-green-500' />
              Categories
            </Link>

            {/* View Category */}
            <Link href='admin/view-grocery' className='flex items-center gap-1.5 bg-white text-green-700 font-semibold p-2 rounded-full hover:bg-green-100 transition-all duration-300 w-full text-sm'>
              <PackagePlus className='w-5 h-5 text-green-500' />
              Groceries
            </Link>
            {/* Manager Orders */}
            <Link href='admin/manage-orders' className='flex items-center gap-1.5 bg-white text-green-700 font-semibold p-2 rounded-full hover:bg-green-100 transition-all duration-300 w-full text-sm'>
              <Package className='w-5 h-5 text-green-500' />
              Orders
            </Link>
            {/* Manager Users */}
            <Link href='admin/manage-users' className='flex items-center gap-1.5 bg-white text-green-700 font-semibold p-2 rounded-full hover:bg-green-100 transition-all duration-300 w-full text-sm'>
              <Users className='w-5 h-5 text-green-500' />
              Users
            </Link>
          </div>
        )}

        {/* User Image */}
        <div ref={avatarRef} className='relative bg-white rounded-full p-2 h-full flex items-center justify-center cursor-pointer' onClick={() => setShowUserMenu(prev => !prev)}>
          {user?.role === 'admin' ? (
            user?.image
              ? <Image src={user?.image as string || profileImage} alt='admin' width={20} height={20} className='w-5 h-5 rounded-full' />
              : <UserCog className='w-5 h-5 text-green-500' />
          ) : (
            (user?.role === 'user' || user?.role === 'deliveryBoy') && user?.image
              ? <Image src={user?.image as string || profileImage} alt='user' width={20} height={20} className='w-5 h-5 rounded-full' />
              : <User className='w-5 h-5 text-green-500' />
          )}
          {user?.role === 'admin' && pendingOrdersCount > 0 && (
            <span className='absolute -top-1.5 -right-2 min-w-5 h-5 px-1 text-white font-bold text-xs flex items-center justify-center bg-red-500 rounded-full'>
              {pendingOrdersCount > 99 ? '99+' : pendingOrdersCount}
            </span>
          )}
        </div>

        {/* Dropdown Profile */}
        <AnimatePresence mode="wait">
          {showUserMenu && (
            <motion.div
              key="user-menu"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.4 }}
              className='absolute top-16 right-10 w-48 bg-white rounded-2xl shadow-md p-4'
            >
              {/* Profile */}
              <div className='flex items-center gap-2.5 p-2 rounded-md w-full transition-all duration-300 cursor-pointer hover:bg-green-200' onClick={handleEditUser}>
                {user?.role === 'admin' ? (
                  user?.image
                    ? <Image src={user?.image as string || profileImage} alt='admin' width={20} height={20} className='w-5 h-5 rounded-full' />
                    : <UserCog className='w-5 h-5 text-green-500' />
                ) : (
                  (user?.role === 'user' || user?.role === 'deliveryBoy') && user?.image
                    ? <Image src={user?.image as string || profileImage} alt='user' width={20} height={20} className='w-5 h-5 rounded-full' />
                    : <User className='w-5 h-5 text-green-500' />
                )}
                <div className='flex flex-col gap-1'>
                  <span className='text-black font-bold text-xs'>{user?.name.toUpperCase()}</span>
                  <span className='text-green-400 text-xs w-auto font-semibold tracking-wide'>{user?.role?.toUpperCase()}</span>
                </div>
              </div>
              {user?.role === 'user' && <>
                <button onClick={() => router.push('/user/my-orders')} className='flex items-center gap-2 p-2 rounded-md w-full transition-all duration-300 cursor-pointer hover:bg-green-200'>
                  <Package className='w-5 h-5 text-green-500' />
                  <span className='text-black text-sm md:text-md relative'>My Orders <span className='absolute top-0 -right-8 text-white font-bold text-xs flex items-center justify-center w-6 h-6 bg-red-500 rounded-full'>{userOrdersCount}</span></span>
                </button>
              </>}
              <hr className='border-gray-200' />
              <button ref={profileDropDown} className='flex items-center gap-2 p-2 rounded-md w-full hover:bg-red-200 transition-all duration-300 cursor-pointer mt-1.5' onClick={() => {
                disconnectSocket()
                signOut({ callbackUrl: '/login' })
              }}>
                <LogOut className='w-5 h-5 text-red-500' />
                <span className='text-black text-xs md:text-sm'>Logout</span>
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Search mobile */}
        <AnimatePresence>
          {showSearchMobile && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.4 }}
              className='fixed top-22 left-0 right-0 z-99 bg-black/50 backdrop-blur-sm p-2.5 w-[80%] mx-auto rounded-2xl text-black'
            >

              <form className='flex items-center gap-2' ref={searchMobileRef} onSubmit={handleSearch}>
                <Search className='w-5 h-5 text-green-500' />
                <input type="text" id="search-mobile" placeholder='Search for a product' className='w-full outline-none text-white placeholder:text-gray-400 focus:outline-none  focus:ring-green-500' value={search} onChange={(e) => setSearch(e.target.value)} />
                <button type='button'>
                  <CircleX className='w-5 h-5 text-red-500 cursor-pointer' onClick={() => {
                    setSearch('')
                    setShowSearchMobile(false)
                  }} />
                </button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Sidebar admin */}
      <AnimatePresence mode='wait'>
        {sideBar && <>
          <motion.div
            initial={{ x: -100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -100, opacity: 0 }}
            transition={{ type: "spring", stiffness: 100, damping: 14 }}
            className='fixed top-0 left-0 text-white h-full w-[50%] mx-auto shadow-xl shadow-black px-4 py-2 z-9999 bg-linear-to-b from-green-800/90 via-green-700/80 to-green-900-90 backdrop-blur-sm flex flex-col'
          >
            {/* Admin Panel */}
            <div className='flex flex-row justify-between items-center'>
              <h1 className='font-extrabold'>Admin Panel</h1>
              <X className='w-5 h-5 text-red-500 cursor-pointer hover:text-red-200 transition-all' onClick={() => setSideBar(false)} />
            </div>

            {/* Profile */}
            <div className='flex flex-row bg-black/10 rounded-lg hover:bg-white/20 items-center gap-2 p-2 mt-5 shadow-md shadow-white/50 border-white border w-full'>
              {(user?.role === 'user' || user?.role === 'deliveryBoy') && <User className='w-5 h-5 text-green-500' />}
              {user?.role === 'admin' && <UserCog className='w-5 h-5 text-green-500' />}
              <div className='flex flex-col gap-1'>
                <span className='text-white font-bold text-sm'>{user?.name.toUpperCase()}</span>
                <span className='text-green-400 text-xs w-auto font-bold tracking-wide'>{user?.role?.toUpperCase()}</span>
              </div>
            </div>

            {/* Items */}
            <div className='flex flex-col gap-3 mt-4'>

              {/* Manage Coupons */}
              <Link href='admin/manage-coupons' className='flex flex-row bg-black/10 rounded-lg hover:bg-white/20 items-center p-2 text-sm gap-2'>
                <PackagePlus className='text-white w-5 h-5' />
                Coupons
              </Link>

              {/* Manage categories */}
              <Link href='admin/view-categories' className='flex flex-row bg-black/10 rounded-lg hover:bg-white/20 items-center p-2 text-sm gap-2'>
                <PackagePlus className='text-white w-5 h-5' />
                Categories
              </Link>

              {/* Manage categories */}
              <Link href='admin/view-grocery' className='flex flex-row bg-black/10 rounded-lg hover:bg-white/20 items-center p-2 text-sm gap-2'>
                <PackagePlus className='text-white w-5 h-5' />
                Groceries
              </Link>

              {/* Manager Orders */}
              <Link href='admin/manage-orders' className='flex flex-row bg-black/10 rounded-lg hover:bg-white/20 items-center p-2 text-sm gap-2'>
                <Package className='text-white w-5 h-5' />
                Orders
              </Link>

              {/* Manager */}
              <Link href='admin/manage-users' className='flex flex-row bg-black/10 rounded-lg hover:bg-white/20 items-center p-2 text-sm gap-2'>
                <Users className='text-white w-5 h-5' />
                Users
              </Link>

              {/* Border */}
              <div className='my-2 border-t border-white/50'></div>

            </div>

            {/* Logout */}
            <div onClick={() => { disconnectSocket(); signOut({ callbackUrl: '/login' }) }} className="flex bg-red-200/50 px-2 py-1 mt-auto text-red-400 font-semibold hover:bg-red-500/20 rounded-lg transition-all">
              Logout
            </div>
          </motion.div>
        </>}
      </AnimatePresence>

      {/* Edit User */}
      <AnimatePresence mode='wait' onExitComplete={() => setEdit(false)}>
        {isEdit && (
          <FormEditUser isEdit={isEdit} title="Edit User" description="Edit a user in your system." setEdit={setEdit} editItem={editItem} fetchUsers={fetchUsers} />
        )}
      </AnimatePresence>
    </nav>
  )
}

export default Nav