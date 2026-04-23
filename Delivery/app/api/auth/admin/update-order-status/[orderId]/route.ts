import { auth } from "@/app/auth";
import connectDB from "@/app/lib/db";
import { emitEventHandler } from "@/app/lib/emitEventHandler";
import DeliveryAssignment from "@/app/models/deliveryAssignment.model";
import Orders from "@/app/models/orders.model";
import User from "@/app/models/user.model";
import { NextRequest, NextResponse } from "next/server";


export async function POST(req: NextRequest, { params }: { params: Promise<{ orderId: string }> }) {
    try {
        await connectDB();

        const session = await auth()
        if (!session?.user || (session.user as any)?.role !== 'admin') {
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
        }

        // Lấy orderId từ params (URL parameter)
        const { orderId } = await params

        // Lấy status mới từ body của request
        const { status } = await req.json();

        // Tìm đơn hàng theo ID và populate thông tin user (người đặt hàng)
        const order = await Orders.findById(orderId).populate('user');

        // Nếu không tìm thấy đơn hàng, trả về lỗi 404
        if (!order) {
            return NextResponse.json({ success: false, message: 'Order not found' }, { status: 404 });
        }

        // Cập nhật trạng thái đơn hàng với status mới
        order.status = status;

        // Khởi tạo mảng rỗng để chứa thông tin shipper khả dụng
        let deliveryBoysPayload: any = [];

        // Kiểm tra nếu trạng thái là "Out of delivery" (đang giao) VÀ chưa có assignment
        if (status === 'Out of delivery' && !order?.assignment) {
            const { latitude, longitude } = order.address;

            // Kiểm tra xem order có địa chỉ hợp lệ không
            if (!order?.address || !order?.address?.latitude || !order?.address?.longitude) {
                return NextResponse.json({ success: false, message: 'Order address is invalid or missing coordinates!' }, { status: 400 });
            }

            // Lấy tọa độ (vĩ độ, kinh độ) từ địa chỉ giao hàng
            if (isNaN(Number(latitude)) || isNaN(Number(longitude))) {
                return NextResponse.json({ success: false, message: 'Invalid coordinates!' }, { status: 400 });
            }

            // Tìm các shipper (role = 'delivery') gần vị trí giao hàng
            // Sử dụng $near của MongoDB để tìm theo vị trí địa lý
            const nearbyDeliveryBoys = await User.find({
                role: 'deliveryBoy',
                isOnline: true,
                // location: {
                //     $near: {
                //         $geometry: { type: 'Point', coordinates: [Number(longitude), Number(latitude)] },
                //         $maxDistance: 10000
                //     }
                // }
            })

            // Lấy danh sách ID của các shipper gần đó
            const nearByIds = nearbyDeliveryBoys.map((boy: any) => boy?._id);

            // Tìm các shipper đang bận (đã được assign hoặc đang giao)
            // Lấy danh sách ID shipper có trạng thái 'brodcasted' hoặc 'assigned'
            const busyIds = await DeliveryAssignment.find({
                assignedTo: { $in: nearByIds },
                status: { $in: ['brodcasted', 'completed'] } // Đã sửa: 'assigned' thay vì 'completed'
            }).distinct('assignedTo'); // Lấy giá trị unique của field assignedTo

            // Tạo Set từ busyIds để tìm kiếm nhanh hơn (O(1))
            const busyIdSet = new Set(busyIds?.map(id => String(id)));

            // Lọc ra các shipper khả dụng (không nằm trong danh sách bận)
            const availableDeliveryBoys = nearbyDeliveryBoys.filter((boy: any) => !busyIdSet.has(String(boy?._id)));

            // Lấy danh sách ID của shipper khả dụng
            const candidates = availableDeliveryBoys?.map(b => b?._id)

            // ĐÃ SỬA: Nếu KHÔNG có shipper khả dụng thì return thông báo
            if (!candidates || candidates.length === 0) {
                await order.save();

                // Gọi event socket khi cập nhật trạng thái đơn hàng
                await emitEventHandler("order-status-updated", { orderId: order?._id, status: order?.status })

                return NextResponse.json({ success: true, message: 'There is no available delivery boys!' }, { status: 200 });
            }

            // Tạo bản ghi DeliveryAssignment mới - phân công giao hàng
            const deliveryAssignment = await DeliveryAssignment.create({
                order: order?._id,                    // ID đơn hàng
                brodcastedTo: candidates,          // Danh sách shipper được broadcast
                status: 'brodcasted',              // Trạng thái: đã broadcast
            });

            // Populate thông tin order vào deliveryAssignment
            await deliveryAssignment.populate('order');

            // Gọi event socket khi cập nhật trạng thái đơn hàng
            // for (const boyId of candidates) {
            //     const boy = await User.findById(boyId);
            //     if (boy?.socketId) {
            //         await emitEventHandler("new-assignment", { assignment: deliveryAssignment?._id, order: deliveryAssignment?.order, socketId: boy?.socketId })
            //     }
            // }

            const boys = await User.find({ _id: { $in: candidates } }).select('socketId')
            for (const boy of boys) {
                if (boy?.socketId) {
                    await emitEventHandler("new-assignment", { assignment: deliveryAssignment?._id, order: deliveryAssignment?.order, socketId: boy?.socketId })
                }
            }

            // Gán assignment ID vào đơn hàng
            order.assignment = deliveryAssignment?._id;

            // Tạo payload chứa thông tin shipper để trả về client
            deliveryBoysPayload = availableDeliveryBoys?.map(b => ({
                id: b?._id,                              // ID shipper
                name: b?.name,                           // Tên shipper
                mobile: b?.mobile,                       // Số điện thoại
                latitude: b?.location?.coordinates[1],   // Vĩ độ (index 1)
                longitude: b?.location?.coordinates[0],  // Kinh độ (index 0)
            }))

        }

        if (status === 'Pending' && order?.assignment) {
            // Xóa assignment trong Order
            order.assignment = null;
            // Xóa assignedDeliveryBoy
            order.assignedDeliveryBoy = null;

            // Xóa DeliveryAssignment liên quan đến order này
            await DeliveryAssignment.deleteOne({ order: order?._id });

        }

        // Lưu đơn hàng đã cập nhật vào database
        await order.save();
        // Populate lại thông tin user
        await order.populate('user');

        // Gọi event socket khi cập nhật trạng thái đơn hàng
        await emitEventHandler("order-status-updated", { orderId: order?._id, status: order?.status, assignedDeliveryBoy: order?.assignedDeliveryBoy })

        // Trả về response thành công với assignment ID và danh sách shipper khả dụng
        return NextResponse.json({ success: true, assigment: order?.assignment?._id, availableDeliveryBoys: deliveryBoysPayload }, { status: 200 });

    } catch (error) {
        return NextResponse.json({ success: false, message: 'Update status order failed!', error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
    }
}
