import { useQuery, keepPreviousData } from '@tanstack/react-query'
import axios from 'axios'

const fetchCategories = async () => {
    const { data } = await axios.get(`/api/auth/admin/get-categories`)
    return data?.categories
}

const fetchUnits = async () => {
    const { data } = await axios.get(`/api/auth/admin/get-units`)
    return data?.units
}

export const useCategories = () => {
    return useQuery({
        queryKey: ['categories'],
        queryFn: () => fetchCategories(),
        placeholderData: keepPreviousData,
    })
}

export const useUnits = () => {
    return useQuery({
        queryKey: ['untis'],
        queryFn: () => fetchUnits(),
        placeholderData: keepPreviousData,
    })
}
