import { createSlice, PayloadAction } from "@reduxjs/toolkit"
import { IUser } from "../models/user.model"

interface IUserSlice {
    userData: IUser | null
}

const initialState: IUserSlice = {
    userData: null
}

export const userSlice = createSlice({
    name: 'user',
    initialState,
    reducers: {
        setUserData: (state, action: PayloadAction<IUser | null>) => {
            if (action.payload && state.userData) {
                // Giữ isOnline hiện tại, không để API stale override
                state.userData = {
                    ...action.payload,
                    isOnline: state.userData.isOnline,
                    socketId: state.userData.socketId
                }
            } else {
                state.userData = action.payload
            }
        },

        // Bổ sung cho luồng user còn giữ session khi truy cập web
        setOnlineStatus: (state, action: PayloadAction<boolean>) => {
            if (state.userData) {
                state.userData.isOnline = action.payload
            }
        },

        setSocketId: (state, action: PayloadAction<string | null>) => {
            if (state.userData) {
                state.userData.socketId = action.payload
            }
        },
    },
})

export const { setUserData, setOnlineStatus, setSocketId } = userSlice.actions
export default userSlice.reducer