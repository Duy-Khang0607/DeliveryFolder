import { Metadata } from "next"
import LoginForm from "../components/LoginForm"

export const metadata: Metadata = {
    title: "Đăng nhập",
    description: "Đăng nhập vào hệ thống giao hàng nhanh tại TP.HCM. Truy cập tài khoản để đặt hàng, theo dõi đơn hàng và quản lý giao hàng.",
}

const Login = () => {
    return <LoginForm />
}

export default Login