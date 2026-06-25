/**
 * FILE AUTH.TS - CẤU HÌNH NEXTAUTH CHO ỨNG DỤNG
 * 
 * LUỒNG HOẠT ĐỘNG KHI USER ĐĂNG NHẬP:
 * 1. User nhập email/password → submit form
 * 2. NextAuth gọi authorize() để xác thực
 * 3. authorize() kiểm tra user trong DB → return user object
 * 4. jwt callback được gọi → thêm data vào JWT token
 * 5. Token được mã hóa và lưu vào cookie
 * 6. Khi client gọi useSession() → session callback được gọi
 * 7. session callback lấy data từ token → trả về session object
 * 
 * CÁCH SỬ DỤNG:
 * - Server Component: const session = await auth()
 * - Client Component: const { data: session } = useSession()
 * - API Route: const session = await auth()
 * - Đăng nhập: await signIn("credentials", { email, password })
 * - Đăng xuất: await signOut()
 */

import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import connectDB from "./lib/db";
import bcrypt from "bcryptjs";
import User, { IUser } from "./models/user.model";
import Google from "next-auth/providers/google";
import { authConfig } from "./auth.config";
// Cấu hình NextAuth với các hàm handlers, signIn, signOut, auth
export const { handlers, signIn, signOut, auth } = NextAuth({

    ...authConfig,
    // PROVIDERS: Định nghĩa các phương thức đăng nhập (Google, Facebook, Credentials...)
    providers: [
        // Credentials Provider: Đăng nhập bằng email/password tự quản lý
        Credentials({
            // Định nghĩa các trường input sẽ hiển thị trên form đăng nhập
            credentials: {
                email: {
                    type: "email",
                    label: "Email"
                },
                password: {
                    type: "password",
                    label: "Password",
                },
            },
            // authorize: Hàm xác thực user khi đăng nhập
            // - Được gọi khi user submit form login
            // - Return user object nếu đăng nhập thành công, null nếu thất bại
            authorize: async (credentials) => {
                try {
                    // 1. Kết nối database
                    await connectDB();

                    // 2. Lấy email và password từ form
                    const { email, password } = credentials as { email: string, password: string };

                    // 3. Tìm user trong database theo email (lean = raw MongoDB, không apply schema defaults)
                    const user = await User.findOne({ email }).lean<IUser>();
                    if (!user) {
                        return null;
                    }

                    // 4. So sánh password với password đã hash trong database
                    const isPasswordCorrect = await bcrypt.compare(password, user.password ?? '');
                    if (!isPasswordCorrect) {
                        return null;
                    }

                    // Chỉ chặn khi DB explicitly lưu false (user mới chưa verify)
                    // undefined = user cũ (legacy) → cho qua
                    if (user.isEmailVerified === false) {
                        throw new Error("EMAIL_NOT_VERIFIED");
                    }

                    // 6. Return user nếu đăng nhập thành công
                    return {
                        id: user._id.toString(),
                        name: user.name,
                        email: user.email,
                        role: user.role ?? 'user',
                    };
                } catch (error) {
                    if (error instanceof Error && error.message === "EMAIL_NOT_VERIFIED") {
                        throw error; // re-throw để NextAuth truyền về client
                    }
                    console.error("❌ Auth error:", error);
                    return null;
                }
            }
        }),
        Google({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        })
    ],

    // CALLBACKS: Các hàm được gọi tự động tại các thời điểm khác nhau trong quá trình authentication
    callbacks: {
        ...authConfig.callbacks, // sử dụng các callbacks từ auth.config.ts
        // Signin
        async signIn({ user, account }) {
            if (account?.provider == 'google') {
                // Connect DB
                await connectDB();
                // find email in database
                let dbUser = await User.findOne({ email: user.email });
                if (!dbUser) {
                    // create user
                    dbUser = await User.create({ email: user.email, name: user.name, image: user.image });
                }

                user.id = dbUser._id.toString();
                user.role = dbUser.role;
            }
            return true;
        },
    },

    // SESSION: Cấu hình session
    session: {
        strategy: "jwt",  // Sử dụng JWT thay vì database sessions (nhẹ hơn, không cần query DB)
        maxAge: 7 * 24 * 60 * 60,   // tối đa 7 ngày (remember me)
        updateAge: 60 * 60,          // gia hạn mỗi 1 giờ khi active
    },

    // SECRET: Key bí mật để mã hóa JWT token (BẮT BUỘC phải có trong .env)
    secret: process.env.NEXTAUTH_SECRET,
}) 