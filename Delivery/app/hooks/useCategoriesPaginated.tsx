import { useQuery, keepPreviousData } from '@tanstack/react-query'
import axios from 'axios'

const fetchCategories = async (page: number, q?: string) => {
    const params = new URLSearchParams({ page: String(page), limit: '20' })
    if (q) params.set('q', q)
    const { data } = await axios.get(`/api/auth/admin/get-categories?${params}`)
    return data
}

export const useCategoriesPaginated = (page: number, q?: string) => {
    return useQuery({
        queryKey: ['categories', 'pagination', page, q],
        queryFn: () => fetchCategories(page, q),
        placeholderData: keepPreviousData,
    })
}
