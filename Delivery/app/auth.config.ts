import type { NextAuthConfig } from "next-auth"

export const authConfig = {
    pages: {
        signIn: "/login",
        error: "/login"
    },
    callbacks: {
        jwt: ({ token, user }) => {
            if (user) {
                token.id = user.id as string
                token.role = user.role as string
                token.name = user.name as string
                token.email = user.email as string
            }
            return token
        },
        session: ({ session, token }) => {
            if (session.user) {
                session.user.id = token.id as string
                session.user.role = token.role as string
                session.user.name = token.name as string
                session.user.email = token.email as string
            }
            return session
        }

    },
    providers: []  // Không import bcrypt/mongoose ở đây
} satisfies NextAuthConfig