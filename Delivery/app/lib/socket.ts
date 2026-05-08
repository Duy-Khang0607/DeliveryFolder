import { io, Socket } from "socket.io-client";


let socket: Socket | null = null;

export const getSocket = () => {
    if (!socket) {
        socket = io(process.env.NEXT_PUBLIC_SOCKET_SERVER)
    }
    return socket
}

export const disconnectSocket = () => {
    if (socket) {
        socket.disconnect()
        socket = null   // reset singleton → getSocket() sẽ tạo socket mới khi login lại
    }
}