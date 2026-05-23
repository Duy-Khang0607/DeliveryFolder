import { useQuery, keepPreviousData } from '@tanstack/react-query'
import axios from 'axios'

const fetchOrdersAdmin = async (page: number, limit = 10) => {
    const { data } = await axios.get(`/api/auth/admin/get-orders?page=${page}&limit=${limit}`)
    return data // { orders: [...], totalPages: 5, total: 50 }
}

const fetchOrdersUser = async (page: number, limit = 10) => {
    const { data } = await axios.get(`/api/auth/user/my-orders?page=${page}&limit=${limit}`)
    return data // { orders: [...], totalPages: 5, total: 50 }
}

export const useOrdersPaginatedAdmin = (page: number) => {
    return useQuery({
        queryKey: ['orders', 'pagination', page],   // cache riêng từng page
        queryFn: () => fetchOrdersAdmin(page),
        placeholderData: keepPreviousData, // không bị flash trắng khi chuyển trang
    })
}

export const useOrdersPaginatedUser = (page: number) => {
    return useQuery({
        queryKey: ['orders', 'pagination', page],   // cache riêng từng page
        queryFn: () => fetchOrdersUser(page),
        placeholderData: keepPreviousData, // không bị flash trắng khi chuyển trang
    })
}