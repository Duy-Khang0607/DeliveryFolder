'use client'
import { Lock, Eye, Loader2, EyeOff, Key } from 'lucide-react'
import { motion } from 'framer-motion'
import { useState } from 'react'
import axios from 'axios'
import { useToast } from '@/app/components/Toast'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useFormWithSchema } from '@/app/hooks/useFormWithSchema'
import { resetPasswordSchema, ResetPasswordFormValues } from '@/app/lib/validationSchemas'
import { FormField } from '@/app/components/ui/FormField'


const ResetPassword = () => {
    const [showPassword, setShowPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)
    const { showToast } = useToast()
    const searchParams = useSearchParams()
    const token = searchParams.get('token')
    const router = useRouter()

    const { register, handleSubmit, formState: { errors, isSubmitting } } = useFormWithSchema(
        resetPasswordSchema,
        { password: '', confirmPassword: '' },
        'onTouched'
    )

    const onSubmit = async (data: ResetPasswordFormValues) => {
        try {
            const res = await axios.post('/api/password/reset-password', { token, password: data.password })
            if (res?.data?.success) {
                showToast(res?.data?.message, 'success')
                router.push('/login')
            } else {
                showToast(res?.data?.message, 'error')
            }
        } catch (error: any) {
            showToast(error?.response?.data?.message || 'Failed to reset password. Please try again later', 'error')
        }
    }

    const inputBase = 'w-full p-3 pl-10 rounded-md border focus:outline-none focus:ring-2 focus:ring-green-500 transition-all duration-300'

    return (
        <div className="w-full min-h-screen flex flex-col items-center justify-center text-center relative">
            <div className="w-full h-full flex flex-col items-center justify-center text-center relative">

                {/* Title */}
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                    className='flex items-center gap-3'
                >
                    <h1 className='text-4xl md:text-5xl text-center text-green-700 font-extrabold'>Reset Password</h1>
                </motion.div>

                {/* Description */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.4, delay: 0.1 }}
                    className='flex items-center gap-2 mt-4'
                >
                    <p className='text-gray-700 text-sm md:text-base max-w-lg'>Enter your new password and confirm it.</p>
                    <Lock className='text-green-600 font-bold h-7 w-7 lg:h-5 lg:w-5' />
                </motion.div>

                {/* Form */}
                <motion.form
                    className='flex flex-col items-center gap-4 w-full max-w-md p-4 rounded-lg mt-2'
                    onSubmit={handleSubmit(onSubmit)}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.4, delay: 0.2 }}
                >
                    {/* New Password */}
                    <FormField error={errors.password?.message}>
                        <Key className='w-5 h-5 text-gray-500 absolute top-3.5 left-2.5' />
                        <input
                            type={showPassword ? 'text' : 'password'}
                            placeholder='New password'
                            autoComplete='new-password'
                            className={`${inputBase} ${errors.password ? 'border-red-400' : 'border-gray-300'}`}
                            {...register('password')}
                        />
                        <button
                            type='button'
                            onClick={() => setShowPassword(p => !p)}
                            className='absolute top-3.5 right-2.5 text-gray-500 hover:text-gray-700 cursor-pointer'
                        >
                            {showPassword ? <Eye className='w-5 h-5' /> : <EyeOff className='w-5 h-5' />}
                        </button>
                    </FormField>

                    {/* Confirm Password */}
                    <FormField error={errors.confirmPassword?.message}>
                        <Lock className='w-5 h-5 text-gray-500 absolute top-3.5 left-2.5' />
                        <input
                            type={showConfirmPassword ? 'text' : 'password'}
                            placeholder='Confirm your new password'
                            autoComplete='new-password'
                            className={`${inputBase} ${errors.confirmPassword ? 'border-red-400' : 'border-gray-300'}`}
                            {...register('confirmPassword')}
                        />
                        <button
                            type='button'
                            onClick={() => setShowConfirmPassword(p => !p)}
                            className='absolute top-3.5 right-2.5 text-gray-500 hover:text-gray-700 cursor-pointer'
                        >
                            {showConfirmPassword ? <Eye className='w-5 h-5' /> : <EyeOff className='w-5 h-5' />}
                        </button>
                    </FormField>

                    {/* Submit */}
                    <motion.button
                        type='submit'
                        disabled={isSubmitting}
                        whileTap={!isSubmitting ? { scale: 0.97 } : {}}
                        className={`${isSubmitting || Object.keys(errors).length > 0
                            ? 'bg-gray-400 cursor-not-allowed'
                            : 'bg-green-600 hover:bg-green-700 cursor-pointer'
                            } text-white px-4 py-2 rounded-md transition-all duration-300 mt-2 w-full flex items-center justify-center`}
                    >
                        {isSubmitting ? <Loader2 className='w-5 h-5 text-white animate-spin' /> : 'Reset Password'}
                    </motion.button>

                    <div className='flex items-center gap-1 text-gray-400 w-full justify-center'>
                        <span className='text-black text-sm md:text-[14px]'>Already have an account?</span>
                        <Link href='/login' className='text-green-600 font-bold text-sm md:text-[14px] hover:text-green-700 transition-all duration-300'>Login</Link>
                    </div>
                </motion.form>
            </div>
        </div>
    )
}

export default ResetPassword
