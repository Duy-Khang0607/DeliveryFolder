import { useQuery, keepPreviousData } from '@tanstack/react-query'
import axios from 'axios'

const fetchOrdersAdmin = async (page: number, status?: string, search?: string, limit = 10) => {
    const params = new URLSearchParams({ page: String(page), limit: String(limit) })
    if (status) params.set('status', status)
    if (search) params.set('search', search)
    const { data } = await axios.get(`/api/auth/admin/get-orders?${params}`)
    return data // { orders: [...], totalPages: 5, total: 50 }
}

const fetchOrdersUser = async (page: number, status?: string, search?: string, limit = 10) => {
    const params = new URLSearchParams({ page: String(page), limit: String(limit) })
    if (status) params.set('status', status)
    if (search) params.set('search', search)
    const { data } = await axios.get(`/api/auth/user/my-orders?${params}`)
    return data
}

export const useOrdersPaginatedAdmin = (page: number,status?: string, search?: string) => {
    return useQuery({
        queryKey: ['orders', 'pagination', page,status,search],   // cache riêng từng page
        queryFn: () => fetchOrdersAdmin(page, status, search ?? ''),
        placeholderData: keepPreviousData, // không bị flash trắng khi chuyển trang
    })
}

export const useOrdersPaginatedUser = (page: number, status?: string, search?: string) => {
    return useQuery({
        queryKey: ['orders', 'pagination', page,status,search],   // cache riêng từng page
        queryFn: () => fetchOrdersUser(page, status, search ?? ''),
        placeholderData: keepPreviousData, // không bị flash trắng khi chuyển trang
    })
}