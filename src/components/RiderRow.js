"use client"

import { useLongPress } from "@/lib/useLongPress"

export default function RiderRow({ rider, index, onOpen, onLongPress }) {
    const longPressProps = !rider.profile_id
        ? useLongPress(function () { onLongPress(rider) })
        : {}

    function getStatusBadge(status) {
        if (status === "active") {
            return { label: "A", bg: "bg-green-100 dark:bg-green-900", text: "text-green-700 dark:text-green-300" }
        } else if (status === "inactive") {
            return { label: "R", bg: "bg-orange-100 dark:bg-orange-900", text: "text-orange-700 dark:text-orange-300" }
        } else {
            return { label: "I", bg: "bg-gray-100 dark:bg-gray-700", text: "text-gray-500 dark:text-gray-300" }
        }
    }
    
    function getInitials(name) {
        const parts = name.trim().split(" ")
        const firstInitial = parts[0] ? parts[0][0] : ""
        const secondInitial = parts[1] ? parts[1][0] : ""
        return (firstInitial + secondInitial).toUpperCase()
    }

    return (
        <button
            onClick={function () { onOpen(rider) }}
            {...longPressProps}
            className={
                index === 0
                ? "w-full flex items-center gap-3 px-4 py-3 text-left select-none"
                : "w-full flex items-center gap-3 px-4 py-3 border-t border-gray-100 dark:border-gray-800 text-left select-none"
            }
        >
            {/* avatar */}
            <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-300 flex items-center justify-center font-medium text-sm flex-shrink-0 overflow-hidden">
                {rider.profile?.avatar_url ? (
                    <img src={rider.profile.avatar_url} alt="" className="w-full h-full object-cover" />
                ) : (
                    getInitials(rider.name)
                )}
            </div>

            <p className="font-medium text-sm flex-1">{rider.name}</p>

            <div className={"w-7 h-7 rounded-lg flex items-center justify-center text-sm font-medium " + getStatusBadge(rider.status).bg + " " + getStatusBadge(rider.status).text}>
                {getStatusBadge(rider.status).label}
            </div>
        </button>
    )
}