import { NextResponse } from 'next/server'
import { authConfig } from "./app/auth.config"
import NextAuth from "next-auth"

const { auth } = NextAuth(authConfig)

export default auth((req) => {
    const { pathname } = req.nextUrl
    const session = req.auth

    const publicRoutes = ['/login', '/register']
    if (publicRoutes.some(route => pathname.startsWith(route))) {
        return NextResponse.next()
    }

    if (!session) {
        const loginUrl = new URL('/login', req.url)
        loginUrl.searchParams.set('callbackUrl', req.url)
        return NextResponse.redirect(loginUrl)
    }

    if (session?.user?.role !== 'user' && pathname.startsWith('/user')) {
        return NextResponse.redirect(new URL('/unauthorized', req.url))
    }

    if (session?.user?.role !== 'admin' && pathname.startsWith('/admin')) {
        return NextResponse.redirect(new URL('/unauthorized', req.url))
    }

    if (session?.user?.role !== 'deliveryBoy' && pathname.startsWith('/delivery')) {
        return NextResponse.redirect(new URL('/unauthorized', req.url))
    }

    return NextResponse.next()
})

export const config = {
    matcher: '/((?!api|_next/static|_next/image|favicon.ico).*)'
}