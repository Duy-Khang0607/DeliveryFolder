'use client'
import { Lock, Eye, Loader2, EyeOff, Key } from 'lucide-react'
import { motion } from 'framer-motion'
import { useState } from 'react';
import axios from 'axios';
import { useToast } from '@/app/components/Toast'
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';


const ResetPassword = () => {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const { showToast } = useToast();
    const searchParams = useSearchParams();
    const token = searchParams.get('token');
    const router = useRouter();


    const handleShowPassword = () => {
        setShowPassword(!showPassword);
    }

    const handleShowConfirmPassword = () => {
        setShowConfirmPassword(!showConfirmPassword);
    }

    const handleResetPassword = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        try {
            setLoading(true);
            const res = await axios.post('/api/password/reset-password', { token, password });
            if (res?.data?.success) {
                showToast(res?.data?.message, "success");
                router.push('/login');
            } else {
                showToast(res?.data?.message, "error");
            }
            console.log({ res })
        } catch (error: any) {
            showToast(error?.response?.data?.message || "Failed to reset password. Please try again later", "error");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="w-full min-h-screen flex flex-col items-center justify-center text-center relative">

            {/* Reset password */}
            <div className="w-full h-full flex flex-col items-center justify-center text-center relative">
                {/* Title */}
                <motion.div className='flex items-center gap-3'>
                    <h1 className='text-4xl md:text-5xl text-center text-green-700 font-extrabold'>Reset Password</h1>
                </motion.div>

                {/* Decsription */}
                <motion.div className='flex items-center gap-2 mt-4'>
                    <p className='text-gray-700 text-sm md:text-base max-w-lg'>Enter your new password and confirm it.</p>
                    <Lock className='text-green-600 font-bold h-7 w-7 lg:h-5 lg:w-5' />
                </motion.div>

                {/* Form */}
                <motion.form
                    className='flex flex-col items-center gap-6 w-full max-w-md p-4 rounded-lg'
                    onSubmit={handleResetPassword}
                    initial={{ opacity: 0 }}
                    animate={{
                        opacity: 1,
                    }}
                    transition={{ duration: 1, delay: 0.3 }}
                >
                    {/* New Password */}
                    <div className='relative w-full flex flex-col gap-3'>
                        <Key className='w-5 h-5 text-gray-500 absolute top-3.5 left-2.5' />
                        <input type={showPassword ? "text" : "password"} placeholder='New password' className='w-full p-3 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500 pl-10 transition-all duration-300' value={password} onChange={(e) => setPassword(e.target.value)} />
                        {showPassword ? <Eye className='w-5 h-5 text-gray-500 absolute top-3.5 right-2.5 cursor-pointer' onClick={handleShowPassword} /> : <EyeOff className='w-5 h-5 text-gray-500 absolute top-3.5 right-2.5 cursor-pointer' onClick={handleShowPassword} />}
                    </div>

                    {/* Confirm New Password */}
                    <div className='relative w-full flex flex-col gap-3'>
                        <Lock className='w-5 h-5 text-gray-500 absolute top-3.5 left-2.5' />
                        <input type={showConfirmPassword ? "text" : "password"} placeholder='Confirm your new password' className='w-full p-3 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500 pl-10 transition-all duration-300' value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
                        {showConfirmPassword ? <Eye className='w-5 h-5 text-gray-500 absolute top-3.5 right-2.5 cursor-pointer' onClick={handleShowConfirmPassword} /> : <EyeOff className='w-5 h-5 text-gray-500 absolute top-3.5 right-2.5 cursor-pointer' onClick={handleShowConfirmPassword} />}
                    </div>

                    {/* Button Reset Password */}
                    <motion.button type='submit' className={`${password.length > 0 && confirmPassword.length > 0 ? 'bg-green-600' : 'bg-gray-500'} text-white px-4 py-2 rounded-md hover:bg-green-700 transition-all duration-300 cursor-pointer mt-2 w-full flex items-center justify-center`}>
                        {loading ? <Loader2 className='w-5 h-5 text-white animate-spin' /> : 'Reset Password'}
                    </motion.button>

                    {/* Already have an account? */}
                    <div className='flex items-center gap-1 text-gray-400 w-full justify-center'>
                        <span className='text-black text-sm md:text-[14px]'>Already have an account ?</span>
                        <Link href='/login' className='text-green-600 font-bold text-sm md:text-[14px] hover:text-green-700 transition-all duration-300'>Login</Link>
                    </div>
                </motion.form>
            </div>

        </div>
    )
}

export default ResetPassword