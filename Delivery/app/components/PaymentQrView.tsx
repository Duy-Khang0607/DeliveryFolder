'use client'

import { formatVnd } from '@/app/lib/currency'
import ButtonHome from '@/app/components/ButtonHome'
import { getSocket } from '@/app/lib/socket'
import axios from 'axios'
import { CheckCircle, CircleCheckBig, Copy, Loader2, MoveRight, QrCode } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useDispatch } from 'react-redux'
import { useQueryClient } from '@tanstack/react-query'
import { clearCart } from '@/app/redux/cartSlice'
import { useToast } from '@/app/components/Toast'

type PaymentQrViewProps = {
    mode: 'pending' | 'order'
    id: string
    backHref?: string
}

type PaymentStatus = {
    status: string
    orderId?: string | null
    qrUrl?: string | null
    transferCode?: string | null
    amount?: number
    expiresAt?: string | null
    isPaid?: boolean
}

type XGatePaymentConfirmedPayload = {
    userId: string
    type: 'pending' | 'order'
    orderId: string
    pendingCheckoutId?: string
}

const PaymentQrView = ({ mode, id, backHref = '/user/checkout' }: PaymentQrViewProps) => {
    const router = useRouter()
    const dispatch = useDispatch()
    const queryClient = useQueryClient()
    const toast = useToast()
    const completedRef = useRef(false)

    const [payment, setPayment] = useState<PaymentStatus | null>(null)
    const [loading, setLoading] = useState(true)
    const [remainingSeconds, setRemainingSeconds] = useState<number | null>(null)
    const [isSuccess, setIsSuccess] = useState(false)
    const [successOrderId, setSuccessOrderId] = useState<string | null>(null)

    const statusUrl =
        mode === 'pending'
            ? `/api/auth/user/payment/pending/${id}/status`
            : `/api/auth/user/payment/order/${id}/status`

    const handlePaymentSuccess = useCallback(
        (orderId: string | null | undefined) => {
            if (completedRef.current) return
            completedRef.current = true

            setIsSuccess(true)
            setSuccessOrderId(orderId ?? null)

            if (mode === 'pending') {
                dispatch(clearCart())
                queryClient.invalidateQueries({ queryKey: ['grocery'] })
            }
            queryClient.invalidateQueries({ queryKey: ['orders'] })
        },
        [dispatch, mode, queryClient]
    )

    const fetchStatus = useCallback(async () => {
        const res = await axios.get(statusUrl)
        return res.data as PaymentStatus
    }, [statusUrl])

    const pollStatus = useCallback(async () => {
        if (completedRef.current) return

        try {
            const data = await fetchStatus()
            setPayment(data)

            if (data.status === 'completed' || data.isPaid) {
                handlePaymentSuccess(data.orderId)
            }
        } catch {
            // Giữ polling im lặng — tránh spam toast khi mạng chập chờn
        }
    }, [fetchStatus, handlePaymentSuccess])

    useEffect(() => {
        let active = true

        const load = async () => {
            try {
                await pollStatus()
            } catch {
                if (active) toast.showToast('Không tải được thông tin thanh toán', 'error')
            } finally {
                if (active) setLoading(false)
            }
        }

        load()
        const interval = setInterval(pollStatus, 2000)

        return () => {
            active = false
            clearInterval(interval)
        }
    }, [pollStatus, toast])

    useEffect(() => {
        const socket = getSocket()

        const onPaymentConfirmed = (data: XGatePaymentConfirmedPayload) => {
            const isPendingMatch =
                mode === 'pending' && data.type === 'pending' && data.pendingCheckoutId === id
            const isOrderMatch = mode === 'order' && data.type === 'order' && data.orderId === id

            if (isPendingMatch || isOrderMatch) {
                handlePaymentSuccess(data.orderId)
            }
        }

        socket?.on('xgate-payment-confirmed', onPaymentConfirmed)
        return () => {
            socket?.off('xgate-payment-confirmed', onPaymentConfirmed)
        }
    }, [handlePaymentSuccess, id, mode])

    useEffect(() => {
        if (!payment?.expiresAt || isSuccess) return

        const tick = () => {
            const diff = Math.floor((new Date(payment.expiresAt!).getTime() - Date.now()) / 1000)
            setRemainingSeconds(Math.max(diff, 0))
        }

        tick()
        const timer = setInterval(tick, 1000)
        return () => clearInterval(timer)
    }, [payment?.expiresAt, isSuccess])

    const handleCopy = async (text: string) => {
        try {
            await navigator.clipboard.writeText(text)
            toast.showToast('Đã sao chép', 'success')
        } catch {
            toast.showToast('Không thể sao chép', 'error')
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-green-700" />
            </div>
        )
    }

    if (isSuccess) {
        return (
            <section className="w-[90%] sm:w-[85%] md:w-[80%] mx-auto h-full pt-10 pb-16">
                <ButtonHome />

                <section className="flex flex-col items-center text-center justify-center min-h-[70vh] gap-4 px-6">
                    <CircleCheckBig className="w-16 h-16 text-green-700" />
                    <h1 className="text-3xl font-extrabold text-green-700">
                        Thanh toán thành công!
                    </h1>
                    <p className="text-base text-gray-600 max-w-md">
                        Hệ thống đã xác nhận chuyển khoản. Đơn hàng của bạn đang được xử lý.
                    </p>

                    <Link
                        href="/user/my-orders"
                        className="text-white bg-green-700 px-5 py-2.5 rounded-lg hover:bg-green-600 transition-all duration-300 flex flex-row items-center gap-2 justify-center font-semibold"
                    >
                        Xem đơn hàng <MoveRight className="w-5 h-5" />
                    </Link>

                    {successOrderId && (
                        <button
                            type="button"
                            onClick={() =>
                                router.push(
                                    `/user/order-success?orderId=${successOrderId}&payment=online`
                                )
                            }
                            className="text-sm text-green-700 underline cursor-pointer"
                        >
                            Xem chi tiết đặt hàng
                        </button>
                    )}
                </section>
            </section>
        )
    }

    if (!payment?.qrUrl) {
        return (
            <section className="w-[90%] mx-auto pt-10 text-center">
                <ButtonHome />
                <p className="mt-20 text-gray-600">Không tìm thấy mã thanh toán.</p>
            </section>
        )
    }

    const isExpired = payment.status === 'expired' || remainingSeconds === 0

    return (
        <section className="w-[90%] sm:w-[85%] md:w-[70%] mx-auto pt-10 pb-16">
            <ButtonHome />

            <div className="max-w-md mx-auto mt-8 bg-white border border-gray-100 rounded-2xl shadow-lg p-6 flex flex-col items-center gap-4">
                <div className="flex items-center gap-2 text-green-700 font-bold text-lg">
                    <QrCode className="w-5 h-5" />
                    Thanh toán VietQR
                </div>

                <p className="text-sm text-gray-500 text-center">
                    Quét mã QR bằng app ngân hàng hoặc chuyển khoản thủ công. Sau khi nhận tiền, trang sẽ tự chuyển sang thông báo thành công.
                </p>

                <div className="relative p-3 bg-white border border-gray-200 rounded-xl">
                    <Image
                        src={payment.qrUrl}
                        alt="VietQR"
                        width={280}
                        height={280}
                        unoptimized
                        className="w-[280px] h-[280px] object-contain"
                    />
                </div>

                <div className="w-full space-y-3">
                    <div className="flex justify-between items-center bg-gray-50 rounded-xl px-4 py-3">
                        <span className="text-sm text-gray-500">Số tiền</span>
                        <span className="font-bold text-green-700">{formatVnd(Number(payment.amount ?? 0))}</span>
                    </div>

                    <div className="flex justify-between items-center bg-gray-50 rounded-xl px-4 py-3 gap-2">
                        <div className="flex flex-col">
                            <span className="text-sm text-gray-500">Nội dung CK</span>
                            <span className="font-mono font-semibold text-gray-800">{payment.transferCode}</span>
                        </div>
                        <button
                            type="button"
                            onClick={() => handleCopy(payment.transferCode ?? '')}
                            className="p-2 rounded-lg border border-gray-200 hover:bg-gray-100 cursor-pointer"
                        >
                            <Copy className="w-4 h-4 text-gray-600" />
                        </button>
                    </div>

                    {remainingSeconds !== null && (
                        <p className={`text-center text-sm ${isExpired ? 'text-red-600' : 'text-gray-500'}`}>
                            {isExpired
                                ? 'Mã thanh toán đã hết hạn'
                                : `Hết hạn sau ${Math.floor(remainingSeconds / 60)}:${String(remainingSeconds % 60).padStart(2, '0')}`}
                        </p>
                    )}

                    {!isExpired && (
                        <div className="flex items-center justify-center gap-2 text-sm text-amber-600">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Đang chờ xác nhận thanh toán...
                        </div>
                    )}

                    {isExpired && (
                        <button
                            type="button"
                            onClick={() => router.push(backHref)}
                            className="w-full py-2.5 rounded-xl bg-green-700 text-white font-semibold hover:bg-green-600 cursor-pointer"
                        >
                            Quay lại
                        </button>
                    )}
                </div>

                <div className="flex items-start gap-2 text-xs text-gray-400">
                    <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>Chuyển đúng số tiền và nội dung CK để hệ thống tự động xác nhận trong vài giây.</span>
                </div>
            </div>
        </section>
    )
}

export default PaymentQrView
