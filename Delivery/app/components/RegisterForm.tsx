'use client'
import { Leaf, Mail, Lock, User, Eye, Loader2, EyeOff, CheckCircle, RefreshCw } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useState, useEffect } from 'react';
import Image from 'next/image';
import googleImage from '@/app/assets/google.jpg'
import Link from 'next/link';
import axios from 'axios';
import { signIn } from 'next-auth/react';
import { useToast } from '@/app/components/Toast'
import { useFormWithSchema } from '../hooks/useFormWithSchema';
import { registerSchema, RegisterFormValues } from '../lib/validationSchemas';
import { FormField } from './ui/FormField';

const CheckEmailScreen = ({ email }: { email: string }) => {
    const { showToast } = useToast()
    const [resending, setResending] = useState(false)
    const [cooldown, setCooldown] = useState(0)

    useEffect(() => {
        if (cooldown <= 0) return
        const t = setInterval(() => setCooldown(prev => prev - 1), 1000)
        return () => clearInterval(t)
    }, [cooldown])

    const handleResend = async () => {
        if (cooldown > 0) return
        setResending(true)
        try {
            const res = await axios.post('/api/auth/resend-verification', { email })
            showToast(res.data.message, 'success')
            setCooldown(60)
        } catch (err: any) {
            showToast(err?.response?.data?.message || 'Failed to resend', 'error')
        } finally {
            setResending(false)
        }
    }

    return (
        <motion.div
            key="check-email"
            initial={{ x: '100%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '100%', opacity: 0 }}
            transition={{ duration: 0.35, ease: 'easeInOut' }}
            className='w-full min-h-screen flex flex-col items-center justify-center text-center px-4'
        >
            <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.2 }}
                className='w-20 h-20 rounded-full bg-green-50 border border-green-200 flex items-center justify-center mb-6'
            >
                <CheckCircle className='w-10 h-10 text-green-600' />
            </motion.div>

            <h1 className='text-2xl md:text-3xl font-extrabold text-gray-800 mb-2'>Check your email!</h1>
            <p className='text-gray-500 text-sm max-w-xs mb-1'>We sent a verification link to</p>
            <p className='text-green-700 font-bold text-sm mb-6 break-all'>{email}</p>

            <a
                href='https://mail.google.com'
                target='_blank'
                rel='noopener noreferrer'
                className='flex items-center justify-center gap-2 w-full max-w-xs py-3 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded-xl transition-all mb-3'
            >
                <Mail className='w-4 h-4' />
                Open Gmail
            </a>

            <button
                onClick={handleResend}
                disabled={resending || cooldown > 0}
                className='flex items-center justify-center gap-2 w-full max-w-xs py-3 bg-gray-100 hover:bg-gray-200 text-gray-600 text-sm font-semibold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed mb-6 cursor-pointer'
            >
                {resending
                    ? <Loader2 className='w-4 h-4 animate-spin' />
                    : <RefreshCw className='w-4 h-4' />}
                {cooldown > 0 ? `Resend in ${cooldown}s` : "Didn't receive it? Resend"}
            </button>

            <Link href='/login' className='text-sm text-gray-400 hover:text-gray-600 transition-colors'>
                ← Back to Login
            </Link>
        </motion.div>
    )
}

const RegisterForm = () => {
    const [showPassword, setShowPassword] = useState(false);
    const [registeredEmail, setRegisteredEmail] = useState<string | null>(null);
    const { showToast } = useToast();

    const handleShowPassword = () => {
        setShowPassword(!showPassword);
    }

    const onSubmit = async (data: RegisterFormValues) => {
        try {
            const res = await axios.post('/api/auth/register', { name: data?.name, email: data?.email, password: data?.password });
            if (res?.data?.success) {
                setRegisteredEmail(res?.data?.email)
            }
        } catch (error: any) {
            showToast(error?.response?.data?.message, "error");
        }
    }

    const { register, handleSubmit, formState: { errors, isSubmitting } } = useFormWithSchema(
        registerSchema,
        { name: '', email: '', password: '' },
        'onTouched'
    )

    if (registeredEmail) {
        return <CheckEmailScreen email={registeredEmail} />
    }



    return (
        <AnimatePresence mode='wait'>
            <motion.div
                key="register"
                initial={{ x: '100%', opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: '100%', opacity: 0 }}
                transition={{ duration: 0.35, ease: 'easeInOut' }}
                className='w-full min-h-screen flex flex-col items-center justify-center text-center relative'
            >
                {/* Title */}
                <motion.div className='flex items-center gap-3'>
                    <h1 className='text-4xl md:text-5xl text-center text-green-700 font-extrabold'>Create Account</h1>
                </motion.div>

                {/* Decsription */}
                <motion.div className='flex items-center gap-2'>
                    <p className='text-gray-700 text-lg md:text-md max-w-lg mt-2'>Create your account.</p>
                    <Leaf className='text-green-600 font-bold h-7 w-7 lg:h-5 lg:w-5' />
                </motion.div>

                {/* Form */}
                <motion.form
                    className='flex flex-col items-center gap-6 w-full max-w-md p-4 rounded-lg'
                    onSubmit={handleSubmit(onSubmit)}
                    initial={{ opacity: 0 }}
                    animate={{
                        opacity: 1,
                    }}
                    transition={{ duration: 1, delay: 0.3 }}
                >
                    {/* Name */}
                    <FormField error={errors.name?.message}>
                        <User className='w-5 h-5 absolute top-3.5 left-2.5 text-gray-500' />
                        <input
                            type="text"
                            placeholder='Your name'
                            className={`w-full p-3 pl-10 rounded-md border ${errors.name ? 'border-red-400' : 'border-gray-300'}`}
                            {...register('name')} />
                    </FormField>

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
                            className={`w-full p-3 pl-10 rounded-md border ${errors.password ? 'border-red-400' : 'border-gray-300'}`}
                            {...register('password')} />
                        {showPassword ? <Eye className='w-5 h-5 text-gray-500 absolute top-3.5 right-2.5 cursor-pointer' onClick={handleShowPassword} /> : <EyeOff className='w-5 h-5 text-gray-500 absolute top-3.5 right-2.5 cursor-pointer' onClick={handleShowPassword} />}
                    </FormField>

                    {/* Button Register */}
                    <motion.button disabled={isSubmitting} type='submit' className={`${errors.email?.message || errors.password?.message ? 'bg-gray-500 cursor-not-allowed' : 'bg-green-600'} text-white px-4 py-2 rounded-md transition-all duration-300 cursor-pointer mt-2 w-full flex items-center justify-center`}>
                        {isSubmitting ? <Loader2 className='w-5 h-5 text-white animate-spin' /> : 'Register'}
                    </motion.button>
                    {/* OR */}
                    <div className='flex items-center gap-1 text-gray-400 w-full'>
                        <span className='flex-1 h-px bg-gray-300'></span>
                        OR
                        <span className='flex-1 h-px bg-gray-300'></span>
                    </div>
                    {/* Google */}
                    <motion.button type='button' className={`bg-white text-gray-700 border border-gray-300 px-4 py-2 rounded-md hover:bg-gray-100 transition-all duration-300 cursor-pointer mt-2 w-full flex items-center gap-2 justify-center`} onClick={(e) => { e.preventDefault(); signIn('google', { callbackUrl: '/' }); }}>
                        <Image src={googleImage} alt='Google' width={20} height={20} />
                        <span className='text-gray-700 font-bold text-sm md:text-base'>Continue with Google</span>
                    </motion.button>
                    {/* Already have an account? */}
                    <div className='flex items-center gap-1 text-gray-400 w-full justify-center'>
                        <span className='text-black text-sm md:text-[14px]'>Already have an account ?</span>
                        <Link href='/login' className='text-green-600 font-bold text-sm md:text-[14px] hover:text-green-700 transition-all duration-300'>Sign in</Link>
                    </div>
                </motion.form>
            </motion.div>
        </AnimatePresence>
    )
}

export default RegisterForm