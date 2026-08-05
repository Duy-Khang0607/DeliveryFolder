import { useQuery, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'

const fetchGroceryId = async (id: string) => {
    const { data } = await axios.get(`/api/auth/user/get-grocery/${id}`)
    return data
}

export const useGetGroceryById = (id: string) => {
    // const queryClient = useQueryClient()

    return useQuery({
        queryKey: ['grocery', 'id', id],
        queryFn: () => fetchGroceryId(id),
        enabled: !!id,   // chỉ fetch khi id có giá trị
        staleTime: 0,
        // initialData: () => {
        //     // Tìm trong tất cả list cache đang có
        //     const allCaches = queryClient.getQueriesData<any>({ queryKey: ['grocery', 'pagination'] })
        //     for (const [, data] of allCaches) {
        //         const found = data?.groceries?.find((g: any) => g._id === id)
        //         if (found) return { success: true, grocery: found }
        //     }
        // },
    })
}