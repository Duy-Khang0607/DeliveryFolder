'use client'
import { useEffect, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { CheckCircle, XCircle, Loader2, Mail, RefreshCw } from 'lucide-react'
import axios from 'axios'
import Link from 'next/link'

type Status = 'loading' | 'success' | 'error'

const VerifyEmailPage = () => {
    const searchParams = useSearchParams()
    const router = useRouter()
    const token = searchParams.get('token')
    const [status, setStatus] = useState<Status>('loading')
    const [message, setMessage] = useState('')
    const [countdown, setCountdown] = useState(4)

    // Resend state
    const [resendEmail, setResendEmail] = useState('')
    const [resending, setResending] = useState(false)
    const [resendMessage, setResendMessage] = useState('')
    const [cooldown, setCooldown] = useState(0)

    const hasVerified = useRef(false)

    useEffect(() => {
        if (cooldown <= 0) return
        const t = setInterval(() => setCooldown(prev => prev - 1), 1000)
        return () => clearInterval(t)
    }, [cooldown])

    const handleResend = async () => {
        if (!resendEmail.trim() || cooldown > 0) return
        setResending(true)
        setResendMessage('')
        try {
            const res = await axios.post('/api/auth/resend-verification', { email: resendEmail.trim() })
            setResendMessage(res.data.message)
            setCooldown(60)
        } catch (err: any) {
            setResendMessage(err?.response?.data?.message || 'Failed to resend. Please try again.')
        } finally {
            setResending(false)
        }
    }

    useEffect(() => {
        if (hasVerified.current) return  // chặn lần gọi thứ 2
        hasVerified.current = true

        if (!token) {
            setStatus('error')
            setMessage('Invalid verification link.')
            return
        }

        const verify = async () => {
            try {
                const res = await axios.get(`/api/auth/verify-email?token=${token}`)
                if (res.data.success) {
                    setStatus('success')
                    setMessage(res.data.message)
                } else {
                    setStatus('error')
                    setMessage(res.data.message)
                }
            } catch (err: any) {
                setStatus('error')
                setMessage(err?.response?.data?.message || 'Verification failed.')
            }
        }

        verify()
    }, [token])

    // Auto redirect về login sau 4 giây nếu thành công
    useEffect(() => {
        if (status !== 'success') return
        const interval = setInterval(() => {
            setCountdown(prev => prev - 1)
        }, 1000)
        return () => clearInterval(interval)
    }, [status])

    // useEffect riêng để watch countdown
    useEffect(() => {
        if (countdown <= 0 && status === 'success') {
            router.push('/login')
        }
    }, [countdown, status, router])

    return (
        <div className='min-h-screen flex items-center justify-center bg-gray-50 px-4'>
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className='bg-white rounded-2xl shadow-lg border border-gray-100 p-8 max-w-sm w-full text-center'
            >
                {/* Loading */}
                {status === 'loading' && (
                    <>
                        <div className='w-16 h-16 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-4'>
                            <Loader2 className='w-8 h-8 text-green-600 animate-spin' />
                        </div>
                        <h1 className='text-lg font-bold text-gray-800 mb-1'>Verifying your email...</h1>
                        <p className='text-sm text-gray-400'>Please wait a moment.</p>
                    </>
                )}

                {/* Success */}
                {status === 'success' && (
                    <>
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                            className='w-16 h-16 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-4'
                        >
                            <CheckCircle className='w-9 h-9 text-green-600' />
                        </motion.div>
                        <h1 className='text-lg font-extrabold text-gray-800 mb-1'>Email Verified!</h1>
                        <p className='text-sm text-gray-500 mb-5'>{message}</p>
                        <p className='text-xs text-gray-400 mb-4'>
                            Redirecting to login in <span className='font-bold text-green-600'>{countdown}s</span>...
                        </p>
                        <Link
                            href='/login'
                            className='block w-full py-2.5 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded-xl transition-all'
                        >
                            Go to Login
                        </Link>
                    </>
                )}

                {/* Error */}
                {status === 'error' && (
                    <>
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                            className='w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4'
                        >
                            <XCircle className='w-9 h-9 text-red-500' />
                        </motion.div>
                        <h1 className='text-lg font-extrabold text-gray-800 mb-1'>Link Expired</h1>
                        <p className='text-sm text-gray-500 mb-5'>{message}</p>

                        {/* Resend section */}
                        <div className='flex flex-col gap-2 mb-4'>
                            <p className='text-xs text-gray-400 text-left font-medium'>Send a new verification link:</p>
                            <div className='relative'>
                                <Mail className='w-4 h-4 text-gray-400 absolute top-1/2 -translate-y-1/2 left-3' />
                                <input
                                    type='email'
                                    placeholder='Enter your email'
                                    value={resendEmail}
                                    onChange={e => setResendEmail(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && handleResend()}
                                    className='w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 transition-all'
                                />
                            </div>
                            <button
                                onClick={handleResend}
                                disabled={resending || cooldown > 0 || !resendEmail.trim()}
                                className='flex items-center justify-center gap-2 w-full py-2.5 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl transition-all cursor-pointer'
                            >
                                {resending
                                    ? <Loader2 className='w-4 h-4 animate-spin' />
                                    : <RefreshCw className='w-4 h-4' />}
                                {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend Verification Email'}
                            </button>

                            {resendMessage && (
                                <p className={`text-xs text-center font-medium ${resendMessage.includes('sent') ? 'text-green-600' : 'text-red-500'}`}>
                                    {resendMessage}
                                </p>
                            )}
                        </div>

                        <Link
                            href='/login'
                            className='block w-full py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-600 text-sm font-semibold rounded-xl transition-all'
                        >
                            Back to Login
                        </Link>
                    </>
                )}
            </motion.div>
        </div>
    )
}

export default VerifyEmailPage
