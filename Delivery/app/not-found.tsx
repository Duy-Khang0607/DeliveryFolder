import { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = {
    title: "Không tìm thấy trang",
    description: "Trang bạn tìm kiếm không tồn tại hoặc đã bị xóa.",
    robots: { index: false, follow: true },
}

export default function NotFound() {
    return (
        <section className="flex flex-col items-center justify-center min-h-screen gap-4 px-4">
            <h1 className="text-8xl font-extrabold text-green-700">404</h1>
            <h2 className="text-2xl md:text-3xl font-bold text-gray-800 text-center">
                Không tìm thấy trang
            </h2>
            <p className="text-gray-500 text-center max-w-md">
                Trang bạn đang tìm kiếm không tồn tại hoặc đã bị di chuyển.
            </p>
            <Link
                href="/"
                className="mt-4 px-6 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors duration-300"
            >
                Về trang chủ
            </Link>
        </section>
    )
}
