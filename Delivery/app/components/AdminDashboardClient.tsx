'use client'

import { AnimatePresence, motion } from "framer-motion"
import { useEffect, useState } from "react"
import { ReactElement } from "react"
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis } from "recharts"
import { getSocket } from "../lib/socket"
import { useToast } from "./Toast"
import { ArrowLeft, ArrowRight, Box, CheckCircle, DollarSign, Loader2, Package, TrendingUp, Truck, User, Wifi, WifiOff, X } from "lucide-react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import axios from "axios"
import Image from "next/image"
import { formatVndCompact } from "../lib/currency"
import { useDeliveryDashboard, useDeliveryHistory } from "../hooks/useDeliveryDashboard"
import DeliveryHistoryModal from "./DeliveryHistoryModal"

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

// ── Delivery boy stats type ────────────────────────────────
interface DeliveryBoyWithStats {
  _id: string
  name: string
  email: string
  mobile?: string
  image?: string | null
  isOnline: boolean
  completedDeliveries: number
  totalBroadcasted: number
  totalRejected: number
  acceptanceRate: number
  totalEarnings: number
  lastDelivery: string | null
}

// Icon map client-side (icons không serialize qua JSON)
const STAT_ICONS: Record<string, ReactElement> = {
  "Total Orders": <Box className='w-5 h-5 text-green-400' />,
  "Total Customers": <User className='w-5 h-5 text-green-400' />,
  "Pending Deliveries": <Truck className='w-5 h-5 text-green-400' />,
  "Total Revenue": <DollarSign className='w-5 h-5 text-green-400' />,
}

const AdminDashboardClient = ({ earning, stats, chartData }: propType) => {
  const [filter, setFilter] = useState<"today" | "sevenDays" | "total">("today")
  const { showToast } = useToast()
  const queryClient = useQueryClient()

  // Delivery boy history state
  const [selectedBoy, setSelectedBoy] = useState<DeliveryBoyWithStats | null>(null)
  const [historyPage, setHistoryPage] = useState(1)

  // Dashboard stats — initialData từ server props, refetch khi socket new-order
  const { data: dashboardData } = useQuery({
    queryKey: ['admin-dashboard'],
    queryFn: () => axios.get('/api/auth/admin/dashboard-stats').then(r => r.data),
    initialData: {
      earning,
      stats: stats.map(s => ({ title: s.title, value: s.value })),
      chartData,
    },
    staleTime: 0,
  })

  const earningState = dashboardData?.earning ?? earning
  const statsState = (dashboardData?.stats ?? stats).map((s: { title: string; value: number }) => ({
    ...s,
    icon: STAT_ICONS[s.title] ?? null,
  }))
  const chartDataState = dashboardData?.chartData ?? chartData

  // Fetch delivery boys
  const { data: deliveryBoys, isLoading: dbLoading } = useDeliveryDashboard()

  // Fetch history for selected boy
  const { data: historyData, isLoading: historyLoading } = useDeliveryHistory(selectedBoy?._id, historyPage)

  const title = filter === "today" ? "Today" : filter === "sevenDays" ? "Last 7 Days" : "Total"

  const activeChartData =
    filter === "today" ? chartDataState?.today
      : filter === "sevenDays" ? chartDataState?.sevenDays
        : chartDataState?.allTime

  const ROLE_CONFIG: Record<string, { label: string; color: string }> = {
    deliveryBoy: { label: 'Delivery', color: 'text-orange-200' },
    admin: { label: 'Admin', color: 'text-purple-200' },
    user: { label: 'User', color: 'text-blue-200' },
  }

  const handleUserStatusUpdated = (data: { userId: string, isOnline: boolean, name: string, role: string }) => {
    const { userId, isOnline, name, role } = data
    const displayName = name || `#${userId.slice(-6)}`
    const config = ROLE_CONFIG[role || ''] || { label: 'User', color: 'text-blue-200' }
    if (data) {
      showToast(
        <div className="flex flex-col leading-tight text-green-700">
          <span className="font-bold text-sm">{displayName}</span>
          <span className="flex items-center gap-1">
            {config.label} ·
            {isOnline
              ? <><Wifi className='w-4 h-4 font-bold text-green-700' /> Online</>
              : <><WifiOff className='w-4 h-4 font-bold text-red-700' /> Offline</>
            }
          </span>
        </div>,
        isOnline ? 'success' : 'error'
      )
    }
    queryClient.invalidateQueries({ queryKey: ['admin-delivery-boys'] })
  }

  useEffect(() => {
    // Lắng nghe socket khi user offline/online
    const socket = getSocket()

    const handleNewOrder = () => {
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] })
    }

    socket?.on('new-order', handleNewOrder)
    socket.on('user-status-updated', handleUserStatusUpdated)
    socket?.on('all-rejected', (data) => {
      showToast(`No delivery boy accepted order #${data?.orderId?.toString()?.slice(-6)}`, 'warning')
    })

    return () => {
      socket.off('new-order', handleNewOrder)
      socket.off('user-status-updated', handleUserStatusUpdated)
      socket.off('all-rejected')
    }
  }, [])

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
          const maxValue = Math.max(...statsState?.map((s: { value: number }) => s?.value), 1)
          return statsState?.map((stat: { title: string; value: number; icon: ReactElement }, index: number) => (
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

      {/* ── Delivery Boys Leaderboard ── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay: 0.3 }}
        className="mt-6"
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-bold text-gray-700">Delivery Boys</h2>
            <p className="text-xs text-gray-400 mt-0.5">Performance overview</p>
          </div>
          <span className="px-2.5 py-1 bg-green-50 text-green-600 rounded-full text-xs font-semibold flex gap-1 items-center justify-center">
            {deliveryBoys?.length} <User className="w-5 h-5" />
          </span>
        </div>

        {dbLoading ? (
          <div className="flex items-center justify-center py-10 bg-white rounded-2xl border border-gray-100">
            <Loader2 className="w-6 h-6 animate-spin text-green-600" />
          </div>
        ) : deliveryBoys?.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 bg-white rounded-2xl border border-dashed border-gray-200 gap-2">
            <Truck className="w-8 h-8 text-gray-300" />
            <p className="text-sm text-gray-400 font-medium">No delivery boys found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {deliveryBoys?.map((boy: DeliveryBoyWithStats, index: number) => (
              <motion.div
                key={boy?._id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.06 }}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden"
              >
                {/* Card header */}
                <div className="px-4 pt-4 pb-3 flex items-center gap-3 border-b border-gray-50">
                  <div className="relative shrink-0">
                    <div className="w-10 h-10 rounded-xl overflow-hidden bg-gray-100 flex items-center justify-center">
                      {boy?.image
                        ? <Image src={boy?.image} alt={boy?.name} width={40} height={40} className="object-cover w-full h-full" />
                        : <User className="w-5 h-5 text-gray-400" />}
                    </div>
                    <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${boy.isOnline ? 'bg-green-500' : 'bg-gray-300'}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-gray-800 text-sm truncate">{boy.name}</p>
                    <p className="text-[11px] text-gray-400 truncate">{boy.email}</p>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${boy.isOnline ? 'bg-green-50 text-green-600 border border-green-200' : 'bg-gray-100 text-gray-400'}`}>
                    {boy.isOnline ? 'Online' : 'Offline'}
                  </span>
                </div>

                {/* Stats row */}
                <div className="px-4 py-3 grid grid-cols-3 gap-2 text-center">
                  <div>
                    <p className="text-xs text-gray-400">Deliveries</p>
                    <p className="text-base font-extrabold text-gray-800">{boy.completedDeliveries}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Earnings</p>
                    <p className="text-base font-extrabold text-green-600">{formatVndCompact(boy.totalEarnings)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Accept %</p>
                    <p className={`text-base font-extrabold ${boy.acceptanceRate >= 70 ? 'text-green-600' : boy.acceptanceRate >= 40 ? 'text-amber-500' : 'text-red-500'}`}>
                      {boy.acceptanceRate}%
                    </p>
                  </div>
                </div>

                {/* Footer */}
                <div className="px-4 pb-4 flex items-center justify-between">
                  <p className="text-[11px] text-gray-400">
                    {boy.lastDelivery
                      ? `Last: ${new Date(boy.lastDelivery).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
                      : 'No deliveries yet'}
                  </p>
                  <button
                    onClick={() => { setSelectedBoy(boy); setHistoryPage(1) }}
                    className="flex items-center gap-1 text-xs font-semibold text-green-600 hover:text-green-800 transition-colors cursor-pointer"
                  >
                    View History <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>

      <DeliveryHistoryModal
        open={!!selectedBoy}
        onClose={() => setSelectedBoy(null)}
        name={selectedBoy?.name || ''}
        subtitle="Delivery History"
        image={selectedBoy?.image}
        stats={selectedBoy ? [
          { icon: <CheckCircle className="w-3.5 h-3.5" />, label: 'Completed', value: selectedBoy.completedDeliveries, color: 'text-green-700 bg-green-50' },
          { icon: <DollarSign className="w-3.5 h-3.5" />, label: 'Earnings', value: formatVndCompact(selectedBoy.totalEarnings), color: 'text-green-700 bg-green-50' },
          { icon: <TrendingUp className="w-3.5 h-3.5" />, label: 'Accept Rate', value: `${selectedBoy.acceptanceRate}%`, color: 'text-blue-700 bg-blue-50' },
        ] : []}
        orders={historyData?.orders ?? []}
        loading={historyLoading}
        historyPage={historyPage}
        totalPages={historyData?.pagination?.totalPages ?? 1}
        onPageChange={setHistoryPage}
        amountKey="totalAmount"
      />

    </div>
  )
}

export default AdminDashboardClient