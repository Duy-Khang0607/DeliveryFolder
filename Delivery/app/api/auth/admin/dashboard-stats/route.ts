import { auth } from "@/app/auth";
import connectDB from "@/app/lib/db";
import Orders from "@/app/models/orders.model";
import Users from "@/app/models/user.model";
import { IOrder } from "@/app/models/orders.model";
import { NextResponse } from "next/server";

export async function GET() {
    try {
        await connectDB();

        const session = await auth();
        if (!session?.user || (session.user as any)?.role !== 'admin') {
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
        }

        const [orders, users] = await Promise.all([
            Orders.find({}).lean(),
            Users.find({ role: { $in: ['user', 'deliveryBoy'] } }).lean(),
        ]);

        const totalOrders = orders.length;
        const totalCustomer = users.filter(u => u.role === 'user').length;
        const pendingDeliveries = orders.filter(o => o.status === 'Pending').length;
        const totalRevenue = orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);

        const now = new Date();
        const startOfToday = new Date(now);
        startOfToday.setHours(0, 0, 0, 0);

        const sevenDaysAgo = new Date(now);
        sevenDaysAgo.setDate(now.getDate() - 6);
        sevenDaysAgo.setHours(0, 0, 0, 0);

        const todayRevenue = orders
            .filter(o => new Date(o.createdAt as any) >= startOfToday)
            .reduce((sum, o) => sum + (o.totalAmount || 0), 0);

        const sevenDaysRevenue = orders
            .filter(o => new Date(o.createdAt as any) >= sevenDaysAgo)
            .reduce((sum, o) => sum + (o.totalAmount || 0), 0);

        const stats = [
            { title: "Total Orders", value: totalOrders },
            { title: "Total Customers", value: totalCustomer },
            { title: "Pending Deliveries", value: pendingDeliveries },
            { title: "Total Revenue", value: totalRevenue },
        ];

        // Chart data — Today (by hour)
        const chartDataToday = Array.from({ length: 24 }, (_, hour) => ({
            day: `${hour.toString().padStart(2, '0')}:00`,
            orders: orders.filter(o => {
                const c = new Date(o.createdAt as any);
                return c.getFullYear() === now.getFullYear() &&
                    c.getMonth() === now.getMonth() &&
                    c.getDate() === now.getDate() &&
                    c.getHours() === hour;
            }).length,
        }));

        // Chart data — Last 7 days
        const chartDataSevenDays = Array.from({ length: 7 }, (_, i) => {
            const day = new Date(now);
            day.setDate(now.getDate() - (6 - i));
            day.setHours(0, 0, 0, 0);
            const nextDay = new Date(day);
            nextDay.setDate(day.getDate() + 1);
            return {
                day: day.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
                orders: orders.filter(o => {
                    const c = new Date(o.createdAt as any);
                    return c >= day && c < nextDay;
                }).length,
            };
        });

        // Chart data — All time (last 12 months)
        const chartDataAllTime = Array.from({ length: 12 }, (_, i) => {
            const monthDate = new Date(now.getFullYear(), now.getMonth() - (11 - i), 1);
            const nextMonth = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 1);
            return {
                day: monthDate.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
                orders: orders.filter(o => {
                    const c = new Date(o.createdAt as any);
                    return c >= monthDate && c < nextMonth;
                }).length,
            };
        });

        return NextResponse.json({
            success: true,
            earning: { today: todayRevenue, sevenDays: sevenDaysRevenue, total: totalRevenue },
            stats,
            chartData: { today: chartDataToday, sevenDays: chartDataSevenDays, allTime: chartDataAllTime },
        }, { status: 200 });

    } catch (error) {
        return NextResponse.json({ success: false, message: 'Failed to fetch dashboard stats' }, { status: 500 });
    }
}
