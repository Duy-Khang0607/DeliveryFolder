'use client'
import { SessionProvider } from 'next-auth/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { useState } from 'react'

// const Provider = ({ children }: { children: React.ReactNode }) => {
//     return (
//         <SessionProvider>
//             {children}
//         </SessionProvider>
//     )
// }

// export default Provider


const Provider = ({ children }: { children: React.ReactNode }) => {
    const [queryClient] = useState(() => new QueryClient({
        defaultOptions: {
            queries: {
                staleTime: 5 * 60 * 1000, // cache 5 phút
                gcTime: 10 * 60 * 1000,   // giữ cache 10 phút
            },
        },
    }))
    return (
        <QueryClientProvider client={queryClient}>
            <SessionProvider>
                {children}
            </SessionProvider>
            <ReactQueryDevtools initialIsOpen={false} />
        </QueryClientProvider>
    )
}
export default Provider