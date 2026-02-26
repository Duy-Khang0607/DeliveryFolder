import HeroSection from './HeroSection'
import { IGrocery } from '../models/grocery.model'
import GrocerySection from './GrocerySection'

const UserDashboard = async ({ groceryList }: { groceryList: IGrocery[] }) => {

  const JSONGrocery = JSON?.parse(JSON?.stringify(groceryList))

  return (
    <>
      <HeroSection />

      <GrocerySection groceryList={JSONGrocery} />
    </>
  )
}

export default UserDashboard