'use client'
import React, { ChangeEvent, useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { BadgePlus, Camera, Edit, Eye, EyeOff, Loader2, Mail, MapPin, Phone, Shield, Truck, User, Wifi, WifiOff } from 'lucide-react'
import { useToast } from './Toast'
import axios from 'axios'
import Image from 'next/image'
import PopupImage from '../HOC/PopupImage'
import { IUser } from '../models/user.model'

interface FormUserProps {
    isEdit: boolean,
    title: string,
    description: string,
    setEdit: React.Dispatch<React.SetStateAction<boolean>>,
    editItem: IUser | null,
    fetchUsers: () => void
}

const ROLE_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
    user: { label: 'User', color: 'bg-blue-100 text-blue-700 border-blue-300', icon: <User className='w-3.5 h-3.5' /> },
    admin: { label: 'Admin', color: 'bg-purple-100 text-purple-700 border-purple-300', icon: <Shield className='w-3.5 h-3.5' /> },
    deliveryBoy: { label: 'Delivery Boy', color: 'bg-orange-100 text-orange-700 border-orange-300', icon: <Truck className='w-3.5 h-3.5' /> },
}

const inputClass = 'w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 text-sm placeholder:text-gray-400'
const labelClass = 'text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 flex items-center gap-1.5'

const FormEditUser = ({ isEdit, title, description, setEdit, editItem, fetchUsers }: FormUserProps) => {
    const [loading, setLoading] = useState<boolean>(false)
    const [loadingImage, setLoadingImage] = useState<boolean>(false)
    const [backendImage, setBackendImage] = useState<File | null>(null)
    const [preview, setPreview] = useState<string | null>()
    const disableAdd = editItem?.name.toString() && editItem?.email.toString() && (editItem?.mobile?.toString() || '') && editItem?.role?.toString() as string;
    const [open, setOpen] = useState<boolean>(false);
    const { showToast } = useToast();
    const [name, setName] = useState<string>(editItem?.name || '')
    const [password, setPassword] = useState<string>(editItem?.password || '')
    const [email, setEmail] = useState<string>(editItem?.email || '')
    const [mobile, setMobile] = useState<string>(editItem?.mobile || '')
    const [role, setRole] = useState<string>(editItem?.role || '')
    const [image] = useState<File | null>(null)
    const [socketId] = useState<string | null>(editItem?.socketId ?? null)
    const [isOnline] = useState<boolean>(editItem?.isOnline || false)
    const [location, setLocation] = useState<{ type: string, coordinates: number[] }>(editItem?.location || { type: 'Point', coordinates: [0, 0] })
    const [showPassword, setShowPassword] = useState(false);
    const isAdmin = editItem?.role === 'admin'
    const endpoint = isAdmin
        ? '/api/auth/admin/update-user'
        : '/api/auth/user/update-profile'

    useEffect(() => {
        if (!editItem) return
        setName(editItem.name || '')
        setEmail(editItem.email || '')
        setMobile(editItem.mobile || '')
        setRole(editItem.role || '')
        setPassword(editItem.password || '')
        setLocation(editItem.location || { type: 'Point', coordinates: [0, 0] })
    }, [editItem])

    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        e.preventDefault()
        setLoadingImage(true)
        try {
            const file = e?.target.files;
            if (!file || file.length == 0) return
            const filterFile = file[0];
            setBackendImage(filterFile)
            setPreview(URL.createObjectURL(filterFile))
            setLoadingImage(false)
        } catch (error) {
            showToast('Error uploading image', "error");
            setLoadingImage(false)
        } finally {
            setLoadingImage(false)
        }
    }

    const handleUpdate = async (e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault()
        setLoading(true)
        try {
            const formData = new FormData()
            formData.append('_id', editItem?._id?.toString() || '')
            formData.append('name', name)
            formData.append('password', password)
            formData.append('email', email)
            formData.append('mobile', mobile)
            formData.append('role', role)
            if (image) formData.append('image', image as Blob)
            formData.append('socketId', socketId || 'null')
            formData.append('isOnline', isOnline.toString() || 'false')
            formData.append('location', JSON.stringify(location))
            if (backendImage) formData.append('image', backendImage)

            const response: any = await axios.put(endpoint, formData)

            if (response?.data?.success) {
                showToast(response?.data?.message, "success");
                setEdit(false)
                await fetchUsers()
            } else {
                showToast(response?.data?.message, "error");
                setEdit(false)
            }
            setLoading(false)
        } catch (error) {
            setLoading(false)
            showToast('System error', "error");
            setEdit(false)
        }
    }

    const handleShowPassword = () => {
        setShowPassword(!showPassword);
    }

    const currentRole = ROLE_CONFIG[role]
    const avatarSrc = preview || (typeof editItem?.image === 'string' ? editItem.image : '')

    return (
        <div
            className="fixed inset-0 z-999 flex items-center justify-center bg-black/60 backdrop-blur-sm"
            onClick={() => setEdit(false)}
        >
            <motion.div
                className="relative w-full md:max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl bg-white shadow-2xl border border-gray-100 py-5"
                initial={{ scale: 0.94, opacity: 0, y: 16 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.94, opacity: 0, y: 16 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Title && Description */}
                <div className='flex flex-col items-center justify-center gap-2 tracking-wide text-xl font-semibold px-6 text-black'>
                    <span className='flex flex-row items-center gap-2 justify-center'>
                        {isEdit ? <Edit className='w-5 h-5 text-green-700' /> : <BadgePlus className='w-5 h-5 text-green-700' />}
                        {title}
                    </span>
                    <p className='text-sm max-w-sm md:max-w-xl'>{description}</p>
                </div>

                {/* Avatar overlap */}
                <div className='relative -mt-10 px-6 mb-4 flex items-end gap-4'>
                    <div className='relative shrink-0'>
                        <div className='w-20 h-20 rounded-2xl border-4 border-white shadow-xl overflow-hidden bg-gray-100'>
                            {loadingImage ? (
                                <div className='w-full h-full flex items-center justify-center'>
                                    <Loader2 className='w-6 h-6 animate-spin text-green-600' />
                                </div>
                            ) : avatarSrc ? (
                                <Image
                                    onClick={() => setOpen(true)}
                                    src={avatarSrc}
                                    width={80}
                                    height={80}
                                    alt="Avatar"
                                    className="object-cover w-full h-full cursor-pointer"
                                />
                            ) : (
                                <div className='w-full h-full flex items-center justify-center bg-linear-to-br from-green-100 to-emerald-200'>
                                    <User className='w-8 h-8 text-green-600' />
                                </div>
                            )}
                        </div>
                        <label
                            htmlFor="file-upload"
                            className='absolute top-0 right-0 bg-green-600 hover:bg-green-700 text-white rounded-lg p-1.5 cursor-pointer shadow-md transition-all'
                            onClick={(e) => e.stopPropagation()}
                        >
                            <Camera className='w-5 h-5' />
                        </label>
                        <input type="file" id="file-upload" className="hidden" onChange={handleFileChange} accept='image/*' />
                    </div>

                    <div className='flex flex-col gap-2'>
                        <p className='font-bold text-gray-800 text-base leading-tight'>{name || 'User Name'}</p>
                        <div className='flex items-center gap-1.5 mt-1'>
                            {currentRole && (
                                <span className={`flex flex-row  items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border ${currentRole.color}`}>
                                    {currentRole.icon}
                                    {currentRole.label}
                                </span>
                            )}
                            <span className={`flex flex-row items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border ${isOnline ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-600 border-red-200'}`}>
                                {isOnline ? <Wifi className='w-3 h-3' /> : <WifiOff className='w-3 h-3' />}
                                {isOnline ? 'Online' : 'Offline'}
                            </span>
                        </div>
                    </div>

                    <AnimatePresence>
                        {open && avatarSrc && (
                            <PopupImage image={avatarSrc} setOpen={setOpen} />
                        )}
                    </AnimatePresence>
                </div>

                {/* Form body */}
                <form className='px-6 pb-6 flex flex-col gap-4 text-black'>

                    {/* Section: Personal Info */}
                    <div className='bg-gray-50 rounded-2xl p-4 flex flex-col gap-3 border border-gray-100'>
                        <p className='text-xs font-bold text-gray-400 uppercase tracking-widest'>Personal Info</p>

                        {/* Name */}
                        <div>
                            <label className={labelClass}>
                                <User className='w-3.5 h-3.5' /> Full Name
                            </label>
                            <input
                                required
                                type="text"
                                placeholder='Enter full name'
                                className={inputClass}
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                            />
                        </div>

                        {/* Email + Mobile */}
                        <div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>
                            <div>
                                <label className={labelClass}>
                                    <Mail className='w-3.5 h-3.5' /> Email
                                </label>
                                <input
                                    required
                                    type="email"
                                    placeholder='email@example.com'
                                    className={inputClass}
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className={labelClass}>
                                    <Phone className='w-3.5 h-3.5' /> Mobile
                                </label>
                                <input
                                    required
                                    type="text"
                                    placeholder='Phone number'
                                    className={inputClass}
                                    value={mobile}
                                    onChange={(e) => setMobile(e.target.value)}
                                />
                            </div>
                        </div>

                        {/* Password */}
                        <div>
                            <label className={labelClass}>
                                <Shield className='w-3.5 h-3.5' /> Password
                            </label>
                            <div className='relative'>
                                <input
                                    type={showPassword ? "text" : "password"}
                                    placeholder='Password'
                                    className={`${inputClass} pr-10`}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                                <button
                                    type='button'
                                    onClick={handleShowPassword}
                                    className='absolute top-1/2 -translate-y-1/2 right-3 text-gray-400 hover:text-gray-600 transition-colors'
                                >
                                    {showPassword ? <Eye className='w-4 h-4' /> : <EyeOff className='w-4 h-4' />}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Section: Role & Status */}
                    <div className='bg-gray-50 rounded-2xl p-4 flex flex-col gap-3 border border-gray-100'>
                        <p className='text-xs font-bold text-gray-400 uppercase tracking-widest'>Role & Status</p>

                        <div className='grid grid-cols-1 sm:grid-cols-3 gap-3'>
                            {/* Role */}
                            <div className='sm:col-span-1'>
                                <label className={labelClass}>
                                    <Truck className='w-3.5 h-3.5' /> Role
                                </label>
                                <select
                                    disabled={editItem?.role !== 'admin'}
                                    required
                                    className={inputClass}
                                    value={role}
                                    onChange={(e) => setRole(e.target.value)}
                                >
                                    <option value=''>Select role</option>
                                    <option value='user'>User</option>
                                    <option value='admin'>Admin</option>
                                    <option value='deliveryBoy'>Delivery Boy</option>
                                </select>
                            </div>

                            {/* Socket Status */}
                            <div>
                                <label className={labelClass}>
                                    <Wifi className='w-3.5 h-3.5' /> Socket
                                </label>
                                <div className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-semibold ${socketId === null ? 'bg-red-50 border-red-200 text-red-600' : 'bg-green-50 border-green-200 text-green-700'}`}>
                                    {socketId === null ? <WifiOff className='w-4 h-4' /> : <Wifi className='w-4 h-4' />}
                                    {socketId === null ? 'Disconnected' : 'Connected'}
                                </div>
                            </div>

                            {/* Is Online */}
                            <div>
                                <label className={labelClass}>
                                    <Wifi className='w-3.5 h-3.5' /> Activity
                                </label>
                                <div className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-semibold ${isOnline ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-600'}`}>
                                    <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500 animate-pulse' : 'bg-red-400'}`} />
                                    {isOnline ? 'Online' : 'Offline'}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Section: Location */}
                    <div className='bg-gray-50 rounded-2xl p-4 flex flex-col gap-3 border border-gray-100'>
                        <p className='text-xs font-bold text-gray-400 uppercase tracking-widest'>Location</p>
                        <div>
                            <label className={labelClass}>
                                <MapPin className='w-3.5 h-3.5' /> Location (lng, lat)
                            </label>
                            <div className='relative'>
                                <input
                                    required
                                    disabled={true}
                                    type="text"
                                    placeholder='106.660172, 10.762622'
                                    className={`${inputClass} `}
                                    value={location.coordinates.join(',')}
                                    onChange={(e) => setLocation({ ...location, coordinates: e.target.value.split(',').map(Number) })}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Submit */}
                    <motion.button
                        disabled={!disableAdd || loading}
                        onClick={handleUpdate}
                        type="submit"
                        whileTap={{ scale: 0.98 }}
                        whileHover={{ scale: 1.01 }}
                        className={`w-full py-3 rounded-2xl font-bold text-black text-sm tracking-wide flex items-center justify-center gap-2 transition-all duration-200 shadow-lg ${disableAdd && !loading ? 'bg-linear-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 shadow-green-200 cursor-pointer bg-green-400' : 'bg-gray-300 cursor-not-allowed shadow-none'}`}
                    >
                        {loading ? (
                            <>
                                <Loader2 className='w-4 h-4 animate-spin' />
                                Updating...
                            </>
                        ) : (
                            <>
                                <Edit className='w-4 h-4' />
                                Save Changes
                            </>
                        )}
                    </motion.button>
                </form>
            </motion.div>
        </div>
    )
}

export default FormEditUser
