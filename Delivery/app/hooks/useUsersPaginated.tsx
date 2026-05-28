import { useQuery, keepPreviousData } from '@tanstack/react-query'
import axios from 'axios'

const fetchUsers = async (page: number, q?: string) => {
    const params = new URLSearchParams({ page: String(page), limit: '20' })
    if (q) params.set('q', q)
    const { data } = await axios.get(`/api/auth/admin/get-users?${params}`)
    return data
}

export const useUsersPaginated = (page: number, q?: string) => {
    return useQuery({
        queryKey: ['users', 'pagination', page, q],
        queryFn: () => fetchUsers(page, q),
        placeholderData: keepPreviousData,
    })
}