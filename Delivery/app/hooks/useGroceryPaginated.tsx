import { useQuery, keepPreviousData } from '@tanstack/react-query'
import axios from 'axios'

const fetchGroceryUser = async (page: number, q?: string) => {
    const params = new URLSearchParams({ page: String(page), limit: '20' })
    if (q) params.set('q', q)
    const { data } = await axios.get(`/api/auth/user/get-all-grocery?${params}`)
    return data
}

const fetchGroceryAdmin = async (page: number, q?: string) => {
    const params = new URLSearchParams({ page: String(page), limit: '20' })
    if (q) params.set('q', q)
    const { data } = await axios.get(`/api/auth/admin/get-grocery?${params}`)
    return data
}

export const useGroceryPaginatedUser = (page: number, q?: string) => {
    return useQuery({
        queryKey: ['grocery', 'pagination', page, q],
        queryFn: () => fetchGroceryUser(page, q),
        placeholderData: keepPreviousData,
    })
}

export const useGroceryPaginatedAdmin = (page: number, q?: string) => {
    return useQuery({
        queryKey: ['grocery', 'pagination', page, q],
        queryFn: () => fetchGroceryAdmin(page, q),
        placeholderData: keepPreviousData,
    })
}