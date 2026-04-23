import { createSlice, PayloadAction } from "@reduxjs/toolkit"
import { IGrocery } from "../models/grocery.model"

export interface ICartSlice {
    cartData: IGrocery[],
    subTotal: number,
    deliveryFee: number,
    finalTotal: number

}

const initialState: ICartSlice = {
    cartData: [],
    subTotal: 0,
    deliveryFee: 40,
    finalTotal: 40

}

export const cartSlice = createSlice({
    name: 'cart',
    initialState,
    reducers: {
        addToCart: (state, action: PayloadAction<IGrocery>) => {
            state.cartData.push(action.payload)
            cartSlice.caseReducers.calcTotals(state)
        },
        increaseQuantity: (state, action: PayloadAction<string>) => {
            const item = state.cartData.find(item => String(item?._id) === action.payload)
            if (item) {
                item.quantity = item.quantity + 1;
            }
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
            state.deliveryFee = 40
            state.finalTotal = 40
        },
        calcTotals: (state) => {
            state.subTotal = state.cartData.reduce((sum, item) => sum + Number(item?.price) * item?.quantity, 0)
            state.deliveryFee = state.subTotal > 100 ? 0 : 40;
            state.finalTotal = state.subTotal + state.deliveryFee
        }
    },
})

export const { addToCart, increaseQuantity, decreaseQuantity, removeCart, clearCart, calcTotals } = cartSlice.actions
export default cartSlice.reducer