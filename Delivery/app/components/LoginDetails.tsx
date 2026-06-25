'use client'
import { Loader2, Lock, Eye, EyeOff, Mail, AlertTriangle, RefreshCw } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useState, useEffect } from 'react';
import { useToast } from '@/app/components/Toast';
import { Leaf } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import Image from 'next/image';
import Link from 'next/link';
import googleImage from '@/app/assets/google.jpg'
import { useFormWithSchema } from '../hooks/useFormWithSchema';
import { LoginFormValues, loginSchema } from '../lib/validationSchemas';
import { FormField } from './ui/FormField';
import axios from 'axios';

const LoginDetails = ({ onBack }: { onBack: (isBack: boolean) => void }) => {
    const [showPassword, setShowPassword] = useState(false);
    const [unverifiedEmail, setUnverifiedEmail] = useState<string | null>(null);
    const [resending, setResending] = useState(false);
    const [cooldown, setCooldown] = useState(0);
    const router = useRouter();
    const { showToast } = useToast();

    const { register, handleSubmit, formState: { errors, isSubmitting } } = useFormWithSchema(
        loginSchema,
        { email: '', password: '' },
        'onTouched'
    )

    useEffect(() => {
        if (cooldown <= 0) return
        const t = setInterval(() => setCooldown(prev => prev - 1), 1000)
        return () => clearInterval(t)
    }, [cooldown])

    const handleShowPassword = () => setShowPassword(!showPassword)

    const handleResend = async () => {
        if (cooldown > 0 || !unverifiedEmail) return
        setResending(true)
        try {
            const res = await axios.post('/api/auth/resend-verification', { email: unverifiedEmail })
            showToast(res.data.message, 'success')
            setCooldown(60)
        } catch (err: any) {
            showToast(err?.response?.data?.message || 'Failed to resend', 'error')
        } finally {
            setResending(false)
        }
    }

    const onSubmit = async (data: LoginFormValues) => {
        try {
            setUnverifiedEmail(null)
            const res = await signIn('credentials', { email: data.email, password: data.password, redirect: false });
            if (!res?.error) {
                await router.refresh()
                showToast("Login successfully", "success");
                router.push('/');
            } else if (res.error === 'EMAIL_NOT_VERIFIED') {
                setUnverifiedEmail(data.email)
            } else {
                showToast('Email or password is incorrect', "error");
            }
        } catch (error: any) {
            showToast('Please try again later', "error");
        }
    }

    return (
        <div className='flex flex-col items-center justify-center'>
            {/* Title */}
            <motion.div className='flex items-center gap-3'>
                <h1 className='text-4xl md:text-5xl text-center text-green-700 font-extrabold'>Login</h1>
            </motion.div>

            {/* Description */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 1, delay: 0.3 }}
                className='flex items-center gap-2'
            >
                <p className='text-gray-700 text-lg md:text-md max-w-lg mt-2'>Login to your account.</p>
                <Leaf className='text-green-600 font-bold h-7 w-7 lg:h-5 lg:w-5' />
            </motion.div>

            {/* Email not verified banner */}
            <AnimatePresence>
                {unverifiedEmail && (
                    <motion.div
                        initial={{ opacity: 0, y: -8, height: 0 }}
                        animate={{ opacity: 1, y: 0, height: 'auto' }}
                        exit={{ opacity: 0, y: -8, height: 0 }}
                        transition={{ duration: 0.25 }}
                        className='w-full max-w-md mt-4 overflow-hidden'
                    >
                        <div className='bg-amber-50 border border-amber-200 rounded-xl p-4 flex flex-col gap-2 text-left'>
                            <div className='flex items-center gap-2'>
                                <AlertTriangle className='w-4 h-4 text-amber-600 shrink-0' />
                                <p className='text-sm font-bold text-amber-800'>Email not verified</p>
                            </div>
                            <p className='text-xs text-amber-700'>
                                Please check your inbox and verify <span className='font-semibold'>{unverifiedEmail}</span> before logging in.
                            </p>
                            <button
                                onClick={handleResend}
                                disabled={resending || cooldown > 0}
                                className='flex items-center gap-1.5 mt-1 text-xs font-semibold text-amber-700 hover:text-amber-900 transition-colors disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed w-fit'
                            >
                                {resending
                                    ? <Loader2 className='w-3.5 h-3.5 animate-spin' />
                                    : <RefreshCw className='w-3.5 h-3.5' />}
                                {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend verification email'}
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Form */}
            <motion.form
                initial={{ x: 0, opacity: 1 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: '-100%', opacity: 0 }}
                transition={{ duration: 0.35, ease: 'easeInOut' }}
                onSubmit={handleSubmit(onSubmit)}
                className='flex flex-col items-center gap-3 w-full p-4 rounded-lg'
            >
                {/* Email */}
                <FormField error={errors.email?.message}>
                    <Mail className='w-5 h-5 absolute top-3.5 left-2.5 text-gray-500' />
                    <input
                        type="email"
                        placeholder='Your email'
                        className={`w-full p-3 pl-10 rounded-md border ${errors.email ? 'border-red-400' : 'border-gray-300'}`}
                        {...register('email')} />
                </FormField>

                {/* Password */}
                <FormField error={errors.password?.message}>
                    <Lock className='w-5 h-5 absolute top-3.5 left-2.5 text-gray-500' />
                    <input
                        type={showPassword ? "text" : "password"}
                        placeholder='Your password'
                        autoComplete='current-password'
                        className={`w-full p-3 pl-10 rounded-md border ${errors.password ? 'border-red-400' : 'border-gray-300'}`}
                        {...register('password')} />
                    {showPassword
                        ? <Eye className='w-5 h-5 text-gray-500 absolute top-3.5 right-2.5 cursor-pointer' onClick={handleShowPassword} />
                        : <EyeOff className='w-5 h-5 text-gray-500 absolute top-3.5 right-2.5 cursor-pointer' onClick={handleShowPassword} />}
                </FormField>

                {/* Forgot password */}
                <div
                    onClick={() => onBack(false)}
                    className='text-xs text-green-600 hover:text-green-700 font-semibold transition-colors text-left w-full cursor-pointer'
                >
                    Forgot password?
                </div>

                {/* Button Login */}
                <motion.button
                    disabled={isSubmitting}
                    type='submit'
                    className={`${errors.email?.message || errors.password?.message ? 'bg-gray-500 cursor-not-allowed' : 'bg-green-600'} text-white px-4 py-2 rounded-md transition-all duration-300 cursor-pointer mt-2 w-full flex items-center justify-center`}
                >
                    {isSubmitting ? <Loader2 className='w-5 h-5 text-white animate-spin' /> : 'Login'}
                </motion.button>

                {/* OR */}
                <div className='flex items-center gap-1 text-gray-400 w-full'>
                    <span className='flex-1 h-px bg-gray-300'></span>
                    OR
                    <span className='flex-1 h-px bg-gray-300'></span>
                </div>

                {/* Google */}
                <motion.button
                    type='button'
                    className='bg-white text-gray-700 border border-gray-300 px-4 py-2 rounded-md hover:bg-gray-100 transition-all duration-300 cursor-pointer mt-2 w-full flex items-center gap-2 justify-center'
                    onClick={(e) => { e.preventDefault(); signIn('google', { callbackUrl: '/' }); }}
                >
                    <Image src={googleImage} alt='Google' width={20} height={20} />
                    <span className='text-gray-700 font-bold text-sm md:text-base'>Continue with Google</span>
                </motion.button>

                {/* Don't have an account? */}
                <div className='flex items-center gap-1 text-gray-400 w-full justify-center'>
                    <span className='text-black text-sm md:text-[14px]'>Don't have an account ?</span>
                    <Link href='/register' className='text-green-600 font-bold text-sm md:text-[14px] hover:text-green-700 transition-all duration-300'>Register</Link>
                </div>
            </motion.form>
        </div>
    )
}

export default LoginDetails
