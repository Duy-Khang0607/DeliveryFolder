// app/hooks/useSocketStatus.tsx
'use client'
import { useEffect } from 'react'
import { useDispatch } from 'react-redux'
import { AppDispatch } from '../redux/store'
import { setOnlineStatus, setSocketId } from '../redux/userSlice'
import { getSocket } from '../lib/socket'

const useSocketStatus = (currentUserId: string | null) => {
    const dispatch = useDispatch<AppDispatch>()

    useEffect(() => {
        if (!currentUserId) return

        const socket = getSocket()

        const handleStatusUpdate = ({ userId, isOnline }: { userId: string, isOnline: boolean }) => {
            // Chỉ update nếu là chính mình
            if (userId === currentUserId) {
                dispatch(setOnlineStatus(isOnline))
            }
        }

        // Khi socket connect/reconnect → lấy socket.id mới
        const handleConnect = () => {
            dispatch(setSocketId(socket.id ?? null))
        }
        // Khi socket disconnect
        const handleDisconnect = () => {
            dispatch(setSocketId(null))
        }
        // Nếu socket đã connected ngay từ đầu
        if (socket.connected) {
            dispatch(setSocketId(socket.id ?? null))
        }

        socket.on('user-status-updated', handleStatusUpdate)
        socket.on('connect', handleConnect)
        socket.on('disconnect', handleDisconnect)

        return () => {
            socket.off('user-status-updated', handleStatusUpdate)
            socket.off('connect', handleConnect)
            socket.off('disconnect', handleDisconnect)
        }
    }, [currentUserId, dispatch])
}

export default useSocketStatus