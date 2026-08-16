import { createSlice, PayloadAction } from "@reduxjs/toolkit"
import { IGrocery } from "../models/grocery.model"
import { DELIVERY_PRICING, getMinimumDeliveryFee } from "../lib/deliveryPricing"

export interface ICouponState {
    code: string
    discountType: 'percentage' | 'fixed'
    discountValue: number
    discountAmount: number
}

export interface ICartSlice {
    cartData: IGrocery[]
    subTotal: number
    deliveryFee: number
    discountAmount: number
    finalTotal: number
    coupon: ICouponState | null
}

const initialState: ICartSlice = {
    cartData: [],
    subTotal: 0,
    deliveryFee: getMinimumDeliveryFee(),
    discountAmount: 0,
    finalTotal: getMinimumDeliveryFee(),
    coupon: null,
}

export const cartSlice = createSlice({
    name: 'cart',
    initialState,
    reducers: {
        addToCart: (state, action: PayloadAction<IGrocery>) => {
            const existing = state.cartData.find(i => String(i._id) === String(action.payload._id))

            if (existing) {
                const maxStock = existing.stock ?? action.payload.stock ?? 0

                if (existing.quantity < maxStock) existing.quantity += 1
            } else {
                const maxStock = action.payload.stock ?? 0

                if (maxStock > 0) {
                    state.cartData.push({ ...action.payload, quantity: 1 })
                }
            }
            
            cartSlice.caseReducers.calcTotals(state)
        },
        increaseQuantity: (state, action: PayloadAction<string>) => {
            const item = state.cartData.find(item => String(item?._id) === action.payload)

            if (!item) return

            const maxStock = item.stock ?? 0

            if (item.quantity >= maxStock) return   // chặn tăng

            item.quantity += 1

            cartSlice.caseReducers.calcTotals(state)
        },
        decreaseQuantity: (state, action: PayloadAction<string>) => {
            const item = state.cartData.find(item => String(item?._id) === action.payload)
            if (item?.quantity && item?.quantity > 1) {
                item.quantity = item.quantity - 1;
            } else {
                state.cartData = state.cartData?.filter(item => String(item?._id) !== action.payload)
            }
            cartSlice.caseReducers.calcTotals(state)
        },
        removeCart: (state, action: PayloadAction<string>) => {
            state.cartData = state.cartData.filter(item => String(item?._id) !== action.payload)
            cartSlice.caseReducers.calcTotals(state)
        },
        clearCart: (state) => {
            state.cartData = []
            state.subTotal = 0
            state.deliveryFee = getMinimumDeliveryFee()
            state.discountAmount = 0
            state.finalTotal = getMinimumDeliveryFee()
            state.coupon = null
        },
        applyCoupon: (state, action: PayloadAction<ICouponState>) => {
            state.coupon = action.payload
            state.discountAmount = action.payload.discountAmount
            cartSlice.caseReducers.calcTotals(state)
        },
        removeCoupon: (state) => {
            state.coupon = null
            state.discountAmount = 0
            cartSlice.caseReducers.calcTotals(state)
        },
        setDeliveryFee: (state, action: PayloadAction<number>) => {
            state.deliveryFee = action.payload
            state.finalTotal = Math.max(state.subTotal + state.deliveryFee - state.discountAmount, 0)
        },
        calcTotals: (state) => {
            state.subTotal = state.cartData.reduce((sum, item) => sum + Number(item?.price) * item?.quantity, 0)
            if (state.subTotal >= DELIVERY_PRICING.freeDeliverySubtotalVnd) {
                state.deliveryFee = 0
            } else if (state.deliveryFee === 0 && state.cartData.length > 0) {
                state.deliveryFee = getMinimumDeliveryFee()
            }

            // Tính lại discount nếu có coupon (percentage phụ thuộc subTotal)
            if (state.coupon) {
                if (state.coupon.discountType === 'percentage') {
                    state.discountAmount = Math.min(
                        (state.subTotal * state.coupon.discountValue) / 100,
                        state.subTotal
                    )
                    // Cập nhật lại discountAmount trong coupon object
                    state.coupon.discountAmount = state.discountAmount
                }
                // fixed: discountAmount đã được set khi apply, không thay đổi
            }

            state.finalTotal = Math.max(state.subTotal + state.deliveryFee - state.discountAmount, 0)
        },
        syncCartStock: (
            state,
            action: PayloadAction<{ id: string; stock: number }[]>
        ) => {
            action.payload.forEach(({ id, stock }) => {
                const item = state.cartData.find(i => String(i._id) === id)
                if (item) item.stock = stock
            })
        },
    },
})

export const {
    addToCart,
    increaseQuantity,
    decreaseQuantity,
    removeCart,
    clearCart,
    applyCoupon,
    removeCoupon,
    calcTotals,
    setDeliveryFee,
    syncCartStock,
} = cartSlice.actions

export default cartSlice.reducer
