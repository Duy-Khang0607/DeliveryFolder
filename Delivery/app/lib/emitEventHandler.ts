import axios from "axios"

export async function emitEventHandler(event: string, data: any, socketId?: string) {
    try {
        const response = await axios.post(`${process.env.NEXT_PUBLIC_SOCKET_SERVER}/notify`, {
            event,
            data,
            socketId
        }, {
            headers: { 'x-internal-secret': process.env.INTERNAL_API_SECRET }
        })
        return response?.data
    } catch (error) {
        console.error('❌ Socket error:', error)
        return null
    }

}