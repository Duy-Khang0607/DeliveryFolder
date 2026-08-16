import DeliveryBoyDashboard from './DeliveryBoyDashboard'
import connectDB from '../lib/db'
import { auth } from '../auth'
import Orders from '../models/orders.model'
import { DELIVERY_EARNING_PER_ORDER } from '../lib/currency'

const DeliveryBoy = async () => {
  await connectDB()

  const session = await auth()

  const deliveryBoyId = session?.user?.id;

  const orders = await Orders?.find({ assignedDeliveryBoy: deliveryBoyId, deliveryOTPVerification: true })

  const today = new Date().toDateString();

  const todayDeliveries = orders
    ?.filter((order) => order?.deliveredAt?.toDateString() === today)?.length || 0;

  const todayEarnings = orders
    ?.filter((order) => order?.deliveredAt?.toDateString() === today)
    ?.reduce((sum, order) => sum + (order?.shipperEarning || DELIVERY_EARNING_PER_ORDER), 0) || 0;

  return (
    <>
      <DeliveryBoyDashboard earning={todayEarnings} deliveryCount={todayDeliveries} />
    </>
  )
}

export default DeliveryBoy
