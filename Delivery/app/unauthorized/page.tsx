import { Metadata } from 'next'

export const metadata: Metadata = {
  title: "Truy cập bị từ chối",
  description: "Bạn không có quyền truy cập trang này.",
  robots: { index: false, follow: false },
}

const Unauthorized = () => {
  return (
    <section className='flex flex-col items-center justify-center min-h-screen gap-2'>
        <h1 className='text-4xl font-extrabold text-red-700'>Access Denied !</h1>
        <p className='text-base'>You are not authorized to access this page</p>
    </section>
  )
}

export default Unauthorized