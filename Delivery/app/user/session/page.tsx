'use client'
import { useSession } from 'next-auth/react'

export default function DebugSession() {
    const { data: session, status } = useSession()
    console.log({session})
    return (
        <div>
            <p>Status: {status}</p>
            <p>Expires: {session?.expires ? new Date(session.expires).toLocaleString('vi-VN') : 'N/A'}</p>
       
            <p>Còn lại: {
                session?.expires 
                    ? Math.round((new Date(session.expires).getTime() - Date.now()) / 1000) + 's'
                    : 'N/A'
            }</p>
        </div>
    )
}