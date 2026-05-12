'use client'

import { motion } from "framer-motion"
import { useEffect, useState } from "react"
import { ReactElement } from "react"
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis } from "recharts"
import { getSocket } from "../lib/socket"
import { useToast } from "./Toast"

interface propType {
  earning: {
    today: number,
    sevenDays: number,
    total: number
  }
  stats: { title: string, value: number, icon: ReactElement }[]
  chartData: {
    today: { day: string; orders: number }[]
    sevenDays: { day: string; orders: number }[]
    allTime: { day: string; orders: number }[]
  }
}

const AdminDashboardClient = ({ earning, stats, chartData }: propType) => {
  const [filter, setFilter] = useState<"today" | "sevenDays" | "total">("today")
  const [earningState, setEarningState] = useState(earning)
  const [statsState, setStatsState] = useState(stats)
  const [chartDataState, setChartDataState] = useState(chartData || {})
  const { showToast } = useToast()

  const title = filter === "today" ? "Today" : filter === "sevenDays" ? "Last 7 Days" : "Total"

  useEffect(() => {
    const socket = getSocket()
    socket?.on('all-rejected', (data) => {
      showToast(`No delivery boy accepted order #${data?.orderId?.toString()?.slice(-6)}`, 'warning')
    })
    return () => {
      socket.off('all-rejected')
    }
  }, [])

  useEffect(() => {
    const socket = getSocket()

    const handleNewOrder = (newOrder: any) => {
      const orderAmount = Number(newOrder?.totalAmount) || 0;
      setEarningState(prev => ({
        today: prev?.today + orderAmount,
        sevenDays: prev?.sevenDays + orderAmount,
        total: prev?.total + orderAmount,
      }))

      setStatsState((prev) => prev?.map((item) => {
        return {
          ...item,
          value: item?.title === "Total Orders" ? item?.value + 1 :
            item?.title === "Pending Deliveries" ? item?.value + 1 :
              item?.title === "Total Revenue" ? item?.value + orderAmount : item?.value,
        }
      }) || [])

      setChartDataState((prev) => {
        const orderDate = new Date(newOrder?.createdAt || Date.now())
        // Key cho từng dataset — phải khớp với format khi tạo trong AdminDashboard.tsx
        const todayKey = `${orderDate.getHours().toString().padStart(2, '0')}:00`
        const sevenDaysKey = orderDate.toLocaleDateString('en-US', {
          weekday: 'short', month: 'short', day: 'numeric'
        })
        const allTimeKey = orderDate.toLocaleDateString('en-US', {
          month: 'short', year: '2-digit'
        })
        return {
          today: prev?.today?.map((item) =>
            item.day === todayKey ? { ...item, orders: item.orders + 1 } : item
          ),
          sevenDays: prev?.sevenDays?.map((item) =>
            item.day === sevenDaysKey ? { ...item, orders: item.orders + 1 } : item
          ),
          allTime: prev?.allTime?.map((item) =>
            item.day === allTimeKey ? { ...item, orders: item.orders + 1 } : item
          ),
        }
      })
    }

    // Khi có đơn hàng mới, cập nhật số tiền earning tương ứng theo filter
    socket?.on('new-order', handleNewOrder)

    return () => {
      socket.off('new-order', handleNewOrder)
    }

  }, [])

  const activeChartData =
    filter === "today" ? chartDataState?.today
      : filter === "sevenDays" ? chartDataState?.sevenDays
        : chartDataState?.allTime

  return (
    <div className="pt-24 pb-12 px-2 sm:px-2 lg:px-2 max-w-[90%] mx-auto">

      {/* Header */}
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between mb-8">
        <motion.div
          initial={{ opacity: 0, x: -16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4 }}
        >
          <p className="text-xs font-semibold uppercase tracking-widest text-green-500 mb-1">Overview</p>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-800 leading-tight">
            Admin Dashboard
          </h1>
        </motion.div>

        {/* Filter tabs */}
        <motion.div
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4 }}
          className="flex items-center bg-gray-100 rounded-xl p-1 gap-1 self-start sm:self-auto"
        >
          {(["today", "sevenDays", "total"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-all duration-200 whitespace-nowrap
                ${filter === f
                  ? "bg-white text-green-700 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
                }`}
            >
              {f === "today" ? "Today" : f === "sevenDays" ? "7 Days" : "All Time"}
            </button>
          ))}
        </motion.div>
      </div>

      {/* Earning card */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        className="relative overflow-hidden w-full rounded-2xl bg-gradient-to-r from-green-600 to-emerald-500 p-6 sm:p-8 mb-6 shadow-lg"
      >
        <div className="absolute -top-8 -right-8 w-40 h-40 rounded-full bg-white/10" />
        <div className="absolute -bottom-10 -left-6 w-32 h-32 rounded-full bg-white/10" />
        <p className="text-green-100 text-sm font-medium mb-1 relative">{title} Revenue</p>
        <p className="text-4xl sm:text-5xl font-extrabold text-white relative tracking-tight">
          ${earningState[filter as keyof typeof earningState]?.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || "0.00"}
        </p>
        <p className="text-green-100 text-xs mt-3 relative">Real-time earnings via socket</p>
      </motion.div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {statsState?.length > 0 && (() => {
          const maxValue = Math.max(...statsState?.map(s => s?.value), 1)
          return statsState?.map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.35, delay: index * 0.08 }}
              className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-gray-800 to-gray-900 p-5 cursor-pointer group"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="absolute -bottom-4 -right-4 w-20 h-20 rounded-full bg-white/5" />
              <div className="relative flex items-start justify-between">
                <div>
                  <p className="text-gray-400 text-xs font-medium tracking-wide uppercase mb-3">{stat?.title}</p>
                  <p className="text-3xl font-black text-white">{stat?.value}</p>
                </div>
                <span className="w-10 h-10 flex items-center justify-center rounded-xl bg-green-800/50 text-green-400 text-lg shrink-0 shadow-lg shadow-green-500/50">
                  {stat?.icon}
                </span>
              </div>
              <div className="relative mt-4 h-0.5 w-full bg-white/5 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-green-500 to-emerald-400 rounded-full transition-all duration-700"
                  style={{ width: `${Math.round((stat?.value / maxValue) * 100)}%` }}
                />
              </div>
            </motion.div>
          ))
        })()}
      </div>

      {/* Chart */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay: 0.2 }}
        className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-200 p-5 sm:p-6"
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-bold text-gray-700">Orders Overview</h2>

          </div>
          <span className="px-2.5 py-1 bg-green-50 text-green-600 rounded-full text-xs font-semibold">
            {filter === "today" ? "Today" : filter === "sevenDays" ? "Last 7 Days" : "All Time"}
          </span>
        </div>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={activeChartData || []} barCategoryGap="40%">
            <CartesianGrid stroke="#f0f0f0" strokeDasharray="4 4" vertical={false} />
          <XAxis dataKey="day" tick={{ fontSize: 12, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
          <Tooltip
            contentStyle={{ borderRadius: "10px", border: "none", boxShadow: "0 4px 20px rgba(0,0,0,0.08)", fontSize: "13px" }}
            cursor={{ fill: "#f0fdf4" }}
          />
          <Bar dataKey="orders" fill="#16a34a" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </motion.div>
    </div >
  )
}

export default AdminDashboardClient