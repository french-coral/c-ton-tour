"use client"

import { useEffect, useState } from "react"
import { getTeamName, getTeamRiders, getRiderStats } from "@/lib/queue"
import RiderDetailPopup from "@/components/RiderDetailPopup"

export default function TeamPage() {
    const [teamName, setTeamName] = useState("")
    const [riders, setRiders] = useState([])
    const [selectedRider, setSelectedRider] = useState(null)
    const [selectedRiderStats, setSelectedRiderStats] = useState(null)

    useEffect(function () {
        async function loadData() {
        const teamId = "0b6b6787-0506-4a86-8fa1-cabc3f6b701c"

        const nameResult = await getTeamName(teamId)
        if (!nameResult.error) {
            setTeamName(nameResult.name)
        }

        const ridersResult = await getTeamRiders(teamId)
        if (!ridersResult.error) {
            setRiders(ridersResult.riders)
        }
        }

        loadData()
    }, [])

    function getInitials(name) {
        const parts = name.trim().split(" ")
        const firstInitial = parts[0] ? parts[0][0] : ""
        const secondInitial = parts[1] ? parts[1][0] : ""
        return (firstInitial + secondInitial).toUpperCase()
    }

    async function handleOpenRider(rider) {
        setSelectedRider(rider)

        const statsResult = await getRiderStats(rider.id)
        if (!statsResult.error) {
        setSelectedRiderStats(statsResult.stats)
        }
    }

    function handleClosePopup() {
        setSelectedRider(null)
        setSelectedRiderStats(null)
    }

    return (
        <div className="bg-gray-100 dark:bg-gray-950 min-h-screen p-5">
        <div className="max-w-sm mx-auto">

            <h1 className="text-center text-xl font-medium mb-4">{teamName}</h1>

            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700">
            {riders.map(function (rider, index) {
                return (
                <button
                    key={rider.id}
                    onClick={function () { handleOpenRider(rider) }}
                    className={
                    index === 0
                        ? "w-full flex items-center gap-3 px-4 py-3 text-left"
                        : "w-full flex items-center gap-3 px-4 py-3 border-t border-gray-100 dark:border-gray-800 text-left"
                    }
                >
                    <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-300 flex items-center justify-center font-medium text-sm flex-shrink-0">
                    {getInitials(rider.name)}
                    </div>
                    <p className="font-medium text-sm flex-1">{rider.name}</p>
                    {rider.status !== "active" ? (
                    <span className="text-xs text-gray-400 dark:text-gray-500">
                        {rider.status === "left" ? "Parti" : "Inactif"}
                    </span>
                    ) : null}
                </button>
                )
            })}
            </div>

            {selectedRider ? (
            <RiderDetailPopup
                rider={selectedRider}
                stats={selectedRiderStats}
                onClose={handleClosePopup}
            />
            ) : null}

        </div>
        </div>
    )
}