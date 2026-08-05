'use client'

import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { getSocket } from '@/app/lib/socket'

const GrocerySyncListener = () => {
  const queryClient = useQueryClient()

  useEffect(() => {
    const socket = getSocket()

    const invalidateGrocery = () => {
      queryClient.invalidateQueries({ queryKey: ['grocery'] })
    }

    socket?.on('grocery-created', invalidateGrocery)
    socket?.on('grocery-updated', invalidateGrocery)
    socket?.on('grocery-deleted', invalidateGrocery)

    return () => {
      socket?.off('grocery-created', invalidateGrocery)
      socket?.off('grocery-updated', invalidateGrocery)
      socket?.off('grocery-deleted', invalidateGrocery)
    }
  }, [queryClient])

  return null
}

export default GrocerySyncListener