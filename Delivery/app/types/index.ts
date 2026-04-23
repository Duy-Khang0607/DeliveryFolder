// Shared TypeScript types for client components
// These avoid importing mongoose (a server-only module) in client bundles

export interface IOrderItem {
    grocery: string
    name: string
    price: string
    unit: string
    image: string[]
    quantity: number
}

export interface IOrderAddress {
    fullName: string
    mobile: number
    city: string
    state: string
    pincode: string
    fullAddress: string
    latitude: number
    longitude: number
}

export interface IOrderClient {
    _id: string
    user: string
    items: IOrderItem[]
    totalAmount: number
    paymentMethod: 'cod' | 'online'
    address: IOrderAddress
    status: 'Pending' | 'Out of delivery' | 'Delivered'
    createdAt?: string
    updatedAt?: string
    isPaid: boolean
    assignedDeliveryBoy?: IUserClient | null
    assignment?: string
    deliveryOTP?: string | null
    deliveryOTPVerification: boolean
    deliveredAt?: string | null
}

export interface IUserClient {
    _id: string
    name: string
    email: string
    mobile?: string
    role?: 'user' | 'admin' | 'deliveryBoy'
    image?: string
    socketId?: string | null
    isOnline?: boolean
    location?: {
        type: string
        coordinates: number[]
    }
}

export interface IGroceryClient {
    _id: string
    name: string
    price: string
    unit: string
    category: string
    image: string[]
    quantity?: number
}
