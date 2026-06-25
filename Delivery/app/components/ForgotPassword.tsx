'use client'
import { Loader2, Mail } from 'lucide-react'
import { motion } from 'framer-motion'
import { useToast } from '@/app/components/Toast';
import axios from 'axios';
import { useFormWithSchema } from '../hooks/useFormWithSchema';
import { ForgotPasswordFormValues, forgotPasswordSchema } from '../lib/validationSchemas';
import { FormField } from './ui/FormField';



const ForgotPassword = ({ onBack }: { onBack: (isBack: boolean) => void }) => {
    const { showToast } = useToast();

    const { register, handleSubmit, formState: { errors, isSubmitting } } = useFormWithSchema(
        forgotPasswordSchema,
        { email: '' },
        'onTouched'
    )

    const onSubmit = async (data: ForgotPasswordFormValues) => {
        try {
            const res = await axios.post('/api/password/forgot-password', { email: data.email })
            if (res?.data?.success) {
                showToast("Reset link sent to your email", "success")
            }
        } catch (error: any) {
            showToast(error?.response?.data?.message || "Failed to send reset link", "error")
        }
    }

    return (
        <div className='flex flex-col items-center justify-center'>
            {/* Title */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{
                    opacity: 1,
                }}
                transition={{ duration: 1, delay: 0.3 }}
                className='flex items-center gap-3'
            >
                <h1 className='text-4xl md:text-5xl text-center text-green-700 font-extrabold'>Forgot Password</h1>
            </motion.div>

            {/* Decsription */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{
                    opacity: 1,
                }}
                transition={{ duration: 1, delay: 0.3 }}
                className='flex flex-row items-center justify-center gap-2 mt-4'
            >
                <p className='text-gray-700 text-sm md:text-base max-w-lg'>Send a reset link to your email.</p>
                <Mail className='text-green-600 font-bold h-7 w-7 lg:h-5 lg:w-5 text-center' />
            </motion.div>

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

                {/* Back to login */}
                <div
                    onClick={() => onBack(false)}
                    className='text-xs text-green-600 hover:text-green-700 font-semibold transition-colors text-left w-full cursor-pointer'
                >
                    Back to login
                </div>

                {/* Button Login */}
                <motion.button disabled={isSubmitting} type='submit' className={`${errors.email ? 'bg-gray-500 cursor-not-allowed' : 'bg-green-600'} text-white px-4 py-2 rounded-md transition-all duration-300 cursor-pointer mt-2 w-full flex items-center justify-center`}>
                    {isSubmitting ? <Loader2 className='w-5 h-5 animate-spin' /> : 'Submit'}
                </motion.button>
            </motion.form>
        </div>
    )
}

export default ForgotPassword