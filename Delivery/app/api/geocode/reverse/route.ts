import { NextRequest, NextResponse } from "next/server"

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url)
    const lat = searchParams.get("lat")
    const lon = searchParams.get("lon")

    if (!lat || !lon) {
        return NextResponse.json(
            { error: "lat and lon are required" },
            { status: 400 }
        )
    }

    try {
        const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=18&addressdetails=1`,
            {
                headers: {
                    "User-Agent": "DeliveryApp/1.0",
                },
            }
        )

        if (!res.ok) {
            return NextResponse.json(
                { error: "Failed to fetch from Nominatim" },
                { status: res.status }
            )
        }

        const data = await res.json()
        return NextResponse.json(data)
    } catch (error) {
        console.error("Geocode reverse error:", error)
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        )
    }
}
