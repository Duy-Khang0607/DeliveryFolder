'use client'

import { useSelector } from "react-redux";
import useGetMe from "./hooks/useGetMe"
import useSocketStatus from "./hooks/useSocketStatus";
import { RootState } from "./redux/store";

const InitUser = () => {
    useGetMe();

    const userId = useSelector((state: RootState) => state.user.userData?._id?.toString() ?? null)
    useSocketStatus(userId)

    return null

}

export default InitUser