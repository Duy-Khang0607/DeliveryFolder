import connectDB from "../lib/db"
import Orders from "../models/orders.model"
import AdminDashboardClient from "./AdminDashboardClient"
import Users from "../models/user.model"
import Groceries from "../models/grocery.model"
import { Box, Truck } from "lucide-react"
import { User } from "lucide-react"
import { DollarSign } from "lucide-react"
import { IOrder } from "../models/orders.model"

const AdminDashboard = async () => {

  await connectDB()

  const orders = await Orders.find({})

  const users = await Users.find({ role: "user" })

  const groceries = await Groceries.find({})

  const totalOrders = orders?.length || 0

  const totalCustomer = users?.length || 0

  const pendingDeliveries = orders?.filter((o) => o?.status === "Pending")?.length

  const totalRevenue = orders?.reduce((sum, o) => sum + (o?.totalAmount || 0), 0) || 0

  const totalGroceries = groceries?.length || 0

  const totalDeliveryBoys = users?.filter((u) => u?.role === "deliveryBoy")?.length || 0

  const totalPendingDeliveries = orders?.filter((o) => o?.status === "Pending")?.length || 0

  const totalCompletedDeliveries = orders?.filter((o) => o?.status === "Delivered")?.length || 0

  const today = new Date()
  const startOfToday = new Date(today)
  startOfToday.setHours(0, 0, 0, 0)

  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6)

  const todayOrders = orders?.filter((o) => new Date(o?.createdAt) >= startOfToday)
  const todayRevenue = todayOrders?.reduce((sum, o) => sum + (o?.totalAmount || 0), 0)

  const sevenDaysOrders = orders?.filter((o) => new Date(o?.createdAt) >= sevenDaysAgo)
  const sevenDaysRevenue = sevenDaysOrders?.reduce((sum, o) => sum + (o?.totalAmount || 0), 0)

  const stats = [
    { title: "Total Orders", value: totalOrders, icon: <Box className='w-5 h-5 text-green-700' /> },
    { title: "Total Customers", value: totalCustomer, icon: <User className='w-5 h-5 text-green-700' /> },
    { title: "Pending Deliveries", value: pendingDeliveries, icon: <Truck className='w-5 h-5 text-green-700' /> },
    { title: "Total Revenue", value: totalRevenue, icon: <DollarSign className='w-5 h-5 text-green-700' /> },
  ]

  const formatOrdersData = JSON.parse(JSON.stringify(orders))
  const now = new Date()

  // ── TODAY: nhóm theo giờ (0h → 23h) ──────────────────────────────
  const chartDataToday = Array.from({ length: 24 }, (_, hour) => {
    const ordersCount = formatOrdersData?.filter((o: IOrder) => {
      const createdAt = new Date(o?.createdAt?.toString() || '')
      return (
        createdAt.getFullYear() === now.getFullYear() &&
        createdAt.getMonth() === now.getMonth() &&
        createdAt.getDate() === now.getDate() &&
        createdAt.getHours() === hour
      )
    }).length
    return {
      day: `${hour.toString().padStart(2, '0')}:00`,
      orders: ordersCount,
    }
  })

  // ── LAST 7 DAYS: nhóm theo ngày ──────────────────────────────────
  const chartDataSevenDays = Array.from({ length: 7 }, (_, i) => {
    const day = new Date(now)
    day.setDate(now.getDate() - (6 - i))
    day.setHours(0, 0, 0, 0)
    const nextDay = new Date(day)
    nextDay.setDate(day.getDate() + 1)
    const ordersCount = formatOrdersData?.filter((o: IOrder) => {
      const createdAt = new Date(o?.createdAt?.toString() || '')
      return createdAt >= day && createdAt < nextDay
    }).length
    return {
      day: day.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
      orders: ordersCount,
    }
  })

  // ── ALL TIME: nhóm theo tháng (12 tháng gần nhất) ─────────────────
  const chartDataAllTime = Array.from({ length: 12 }, (_, i) => {
    const monthDate = new Date(now.getFullYear(), now.getMonth() - (11 - i), 1)
    const nextMonth = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 1)
    const ordersCount = formatOrdersData?.filter((o: IOrder) => {
      const createdAt = new Date(o?.createdAt?.toString() || '')
      return createdAt >= monthDate && createdAt < nextMonth
    }).length
    return {
      day: monthDate.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
      orders: ordersCount,
    }
  })

  return (
    <>
      <AdminDashboardClient
        earning={
          {
            today: todayRevenue,
            sevenDays: sevenDaysRevenue,
            total: totalRevenue
          }
        }
        stats={stats}
        chartData={{
          today: chartDataToday,
          sevenDays: chartDataSevenDays,
          allTime: chartDataAllTime,
        }}
      />
    </>
  )
}

export default AdminDashboard