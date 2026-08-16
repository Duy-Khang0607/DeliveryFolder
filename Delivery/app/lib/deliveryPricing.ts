/** Cấu hình phí giao hàng & thu nhập shipper (VND) */
export const DELIVERY_PRICING = {
    /** Tọa độ kho / cửa hàng — mặc định Q1, TP.HCM */
    storeLatitude: Number(process.env.NEXT_PUBLIC_STORE_LATITUDE ?? process.env.STORE_LATITUDE ?? 10.7769),
    storeLongitude: Number(process.env.NEXT_PUBLIC_STORE_LONGITUDE ?? process.env.STORE_LONGITUDE ?? 106.7009),

    /** Phí khách trả: phí cơ bản + phụ phí theo km */
    baseFeeVnd: 15_000,
    perKmVnd: 5_000,
    includedKm: 2,
    maxFeeVnd: 200_000,

    /** Miễn phí ship khi subtotal đạt ngưỡng */
    freeDeliverySubtotalVnd: 500_000,

    /** Thu nhập shipper: cơ bản + theo km (tính độc lập, kể cả đơn freeship) */
    shipperBaseVnd: 10_000,
    shipperPerKmVnd: 4_000,
    shipperIncludedKm: 2,
    maxShipperEarningVnd: 150_000,
} as const

export type DeliveryPricingInput = {
    subTotal: number
    destLatitude: number
    destLongitude: number
}

export type DeliveryPricingResult = {
    distanceKm: number
    deliveryFee: number
    shipperEarning: number
    isFreeDelivery: boolean
}

const toRad = (deg: number) => (deg * Math.PI) / 180

/** Khoảng cách Haversine giữa 2 điểm (km) */
export const calculateDistanceKm = (
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number
): number => {
    const R = 6371
    const dLat = toRad(lat2 - lat1)
    const dLng = toRad(lng2 - lng1)
    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return Math.round(R * c * 10) / 10
}

const clamp = (value: number, min: number, max: number) =>
    Math.min(Math.max(value, min), max)

/** Tính phí giao hàng khách trả + thu nhập shipper theo km */
export const calculateDeliveryPricing = ({
    subTotal,
    destLatitude,
    destLongitude,
}: DeliveryPricingInput): DeliveryPricingResult => {
    const {
        storeLatitude,
        storeLongitude,
        baseFeeVnd,
        perKmVnd,
        includedKm,
        maxFeeVnd,
        freeDeliverySubtotalVnd,
        shipperBaseVnd,
        shipperPerKmVnd,
        shipperIncludedKm,
        maxShipperEarningVnd,
    } = DELIVERY_PRICING

    const distanceKm = calculateDistanceKm(
        storeLatitude,
        storeLongitude,
        destLatitude,
        destLongitude
    )

    const extraKm = Math.max(0, distanceKm - includedKm)
    let deliveryFee = baseFeeVnd + extraKm * perKmVnd
    deliveryFee = clamp(Math.round(deliveryFee), baseFeeVnd, maxFeeVnd)

    const isFreeDelivery = subTotal >= freeDeliverySubtotalVnd
    if (isFreeDelivery) {
        deliveryFee = 0
    }

    const shipperExtraKm = Math.max(0, distanceKm - shipperIncludedKm)
    let shipperEarning = shipperBaseVnd + shipperExtraKm * shipperPerKmVnd
    shipperEarning = clamp(Math.round(shipperEarning), shipperBaseVnd, maxShipperEarningVnd)

    return {
        distanceKm,
        deliveryFee,
        shipperEarning,
        isFreeDelivery,
    }
}

/** Phí tối thiểu khi chưa có địa chỉ (cart) */
export const getMinimumDeliveryFee = (): number => DELIVERY_PRICING.baseFeeVnd

/** Fallback cho đơn cũ chưa có shipperEarning */
export const getLegacyShipperEarning = (): number => DELIVERY_PRICING.shipperBaseVnd
