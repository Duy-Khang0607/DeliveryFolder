import { DELIVERY_PRICING } from './deliveryPricing'

/** Fallback thu nhập shipper cho đơn cũ chưa có field shipperEarning */
export const DELIVERY_EARNING_PER_ORDER = DELIVERY_PRICING.shipperBaseVnd

export const formatVnd = (amount: number): string =>
    `${amount.toLocaleString('vi-VN')} ₫`

export const formatVndCompact = (amount: number): string =>
    `${amount.toLocaleString('en-US')} VND`
