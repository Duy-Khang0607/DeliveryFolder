import { useQuery, keepPreviousData } from '@tanstack/react-query'
import axios from 'axios'
import { IUnits } from '../models/units.model'

const fetchUnits = async (page: number, q?: string) => {
    const params = new URLSearchParams({ page: String(page), limit: '20' })
    if (q) params.set('q', q)
    const { data } = await axios.get(`/api/auth/admin/get-units?${params}`)
    return data
}

export const useUnitsPaginated = (page: number, q?: string) => {
    return useQuery({
        queryKey: ['units', 'pagination', page, q],
        queryFn: () => fetchUnits(page, q),
        placeholderData: keepPreviousData,
    })
}
