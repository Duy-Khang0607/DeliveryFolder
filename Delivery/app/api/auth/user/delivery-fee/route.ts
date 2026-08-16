import { auth } from "@/app/auth"
import { calculateDeliveryPricing } from "@/app/lib/deliveryPricing"
import { NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
    try {
        const session = await auth()
        if (!session?.user) {
            return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
        }

        const { subTotal, latitude, longitude } = await req.json()

        if (subTotal == null || latitude == null || longitude == null) {
            return NextResponse.json(
                { success: false, message: "subTotal, latitude and longitude are required" },
                { status: 400 }
            )
        }

        const pricing = calculateDeliveryPricing({
            subTotal: Number(subTotal),
            destLatitude: Number(latitude),
            destLongitude: Number(longitude),
        })

        return NextResponse.json({ success: true, ...pricing }, { status: 200 })
    } catch {
        return NextResponse.json({ success: false, message: "Failed to calculate delivery fee" }, { status: 500 })
    }
}
