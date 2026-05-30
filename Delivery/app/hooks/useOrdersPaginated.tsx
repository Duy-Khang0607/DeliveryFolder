import { useQuery, keepPreviousData } from '@tanstack/react-query'
import axios from 'axios'

const fetchOrdersAdmin = async (page: number, status?: string, limit = 10) => {
    const params = new URLSearchParams({ page: String(page), limit: String(limit) })
    if (status) params.set('status', status)
    const { data } = await axios.get(`/api/auth/admin/get-orders?${params}`)
    return data // { orders: [...], totalPages: 5, total: 50 }
}

const fetchOrdersUser = async (page: number, status?: string, limit = 10) => {
    const params = new URLSearchParams({ page: String(page), limit: String(limit) })
    if (status) params.set('status', status)
    const { data } = await axios.get(`/api/auth/user/my-orders?${params}`)
    return data
}

export const useOrdersPaginatedAdmin = (page: number,status?: string) => {
    return useQuery({
        queryKey: ['orders', 'pagination', page,status],   // cache riêng từng page
        queryFn: () => fetchOrdersAdmin(page, status),
        placeholderData: keepPreviousData, // không bị flash trắng khi chuyển trang
    })
}

export const useOrdersPaginatedUser = (page: number, status?: string) => {
    return useQuery({
        queryKey: ['orders', 'pagination', page,status],   // cache riêng từng page
        queryFn: () => fetchOrdersUser(page, status),
        placeholderData: keepPreviousData, // không bị flash trắng khi chuyển trang
    })
}