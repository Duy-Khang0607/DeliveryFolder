import { useEffect } from 'react'
import { useQueries } from '@tanstack/react-query'
import { useDispatch, useSelector } from 'react-redux'
import axios from 'axios'
import { RootState } from '@/app/redux/store'
import { syncCartStock } from '@/app/redux/cartSlice'

const fetchGroceryStock = async (id: string) => {
  const { data } = await axios.get(`/api/auth/user/get-grocery/${id}`)
  return data?.grocery
}

export const useCartStockSync = () => {
  const dispatch = useDispatch()
  const cartData = useSelector((state: RootState) => state.cart.cartData)
  const ids = cartData.map(item => String(item._id))

  const queries = useQueries({
    queries: ids.map(id => ({
      queryKey: ['grocery', 'id', id],
      queryFn: () => fetchGroceryStock(id),
      enabled: !!id,
      staleTime: 0,           // cart luôn cần stock mới
      refetchOnMount: 'always',
    })),
  })

  useEffect(() => {
    const updates = queries
      .map((q, i) => {
        const stock = q.data?.stock
        if (stock == null) return null
        return { id: ids[i], stock }
      })
      .filter(Boolean) as { id: string; stock: number }[]

    if (updates.length > 0) {
      dispatch(syncCartStock(updates))
    }
  }, [queries.map(q => q.dataUpdatedAt).join(','), dispatch]) // hoặc deps rõ ràng hơn

  const isSyncing = queries.some(q => q.isLoading || q.isFetching)

  // Map id → stock để UI render (ưu tiên query data)
  const stockMap = Object.fromEntries(
    ids.map((id, i) => [id, queries[i]?.data?.stock ?? cartData[i]?.stock ?? 0])
  )

  return { isSyncing, stockMap }
}