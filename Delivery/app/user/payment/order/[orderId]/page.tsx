'use client'

import PaymentQrView from '@/app/components/PaymentQrView'
import { Suspense, use } from 'react'

type PageProps = {
    params: Promise<{ orderId: string }>
}

const OrderPaymentContent = ({ params }: PageProps) => {
    const { orderId } = use(params)

    return (
        <PaymentQrView
            mode="order"
            id={orderId}
            backHref="/user/my-orders"
        />
    )
}

const OrderPaymentPage = ({ params }: PageProps) => (
    <Suspense fallback={null}>
        <OrderPaymentContent params={params} />
    </Suspense>
)

export default OrderPaymentPage
