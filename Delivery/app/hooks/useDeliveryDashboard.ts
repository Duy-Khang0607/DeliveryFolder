import { useQuery, keepPreviousData } from '@tanstack/react-query'
import axios from 'axios'

const fetchDeliveryStats = async () => {
    const { data } = await axios.get(`/api/auth/admin/delivery-boys`)
    return data?.deliveryBoys ?? []
}

const fetchDeliveryHistory = async (selectedBoy: string, historyPage: number) => {
    const { data } = await axios.get(`/api/auth/admin/delivery-boys/${selectedBoy}/history?page=${historyPage}&limit=8`)
    return data ?? []
}

export const useDeliveryDashboard = () => {
    return useQuery({
        queryKey: ['admin-delivery-boys'],
        queryFn: () => fetchDeliveryStats(),
        placeholderData: keepPreviousData,
    })
}

export const useDeliveryHistory = (selectedBoy: string | undefined, historyPage: number) => {
    return useQuery({
        queryKey: ['delivery-history', selectedBoy, historyPage],
        queryFn: () => fetchDeliveryHistory(selectedBoy || '', historyPage),
        placeholderData: keepPreviousData,
        enabled: !!selectedBoy,
    })
}