'use client'

import PaymentQrView from '@/app/components/PaymentQrView'
import { Suspense } from 'react'
import { use } from 'react'

type PageProps = {
    params: Promise<{ pendingCheckoutId: string }>
}

const PendingPaymentContent = ({ params }: PageProps) => {
    const { pendingCheckoutId } = use(params)

    return (
        <PaymentQrView
            mode="pending"
            id={pendingCheckoutId}
            backHref="/user/checkout"
        />
    )
}

const PendingPaymentPage = ({ params }: PageProps) => (
    <Suspense fallback={null}>
        <PendingPaymentContent params={params} />
    </Suspense>
)

export default PendingPaymentPage
