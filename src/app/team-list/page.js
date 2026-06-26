"use client"

import { useEffect, useState } from "react"
import { getTeamName, getTeamRiders, getRiderStats } from "@/lib/queue"
import { useLockBodyScroll } from "@/lib/useLockBodyScroll"
import RiderDetailPopup from "@/components/RiderDetailPopup"
import {
  getTeamJoinCode,
  addPlaceholderRider,
} from "@/lib/auth"

export default function TeamPage() {
    const [teamName, setTeamName] = useState("")
    const [riders, setRiders] = useState([])
    const [selectedRider, setSelectedRider] = useState(null)
    const [selectedRiderStats, setSelectedRiderStats] = useState(null)

    const [isAddMemberOpen, setIsAddMemberOpen] = useState(false)
    const [addMemberStep, setAddMemberStep] = useState("choose")
    const [teamJoinCode, setTeamJoinCode] = useState(null)
    const [newMemberName, setNewMemberName] = useState("")

    useLockBodyScroll(selectedRider !== null)

    // used to mannually add a member
    function openAddMemberPopup() {
        setAddMemberStep("choose")
        setIsAddMemberOpen(true)
    }

    async function handleShowInviteCode() {
        const teamId = "0b6b6787-0506-4a86-8fa1-cabc3f6b701c"
        const result = await getTeamJoinCode(teamId)
        if (!result.error) {
            setTeamJoinCode(result.joinCode)
        }
        setAddMemberStep("invite")
    }

    async function handleCreateMember() {
        if (!newMemberName) {
            return
        }

        const teamId = "0b6b6787-0506-4a86-8fa1-cabc3f6b701c"
        await addPlaceholderRider(teamId, newMemberName)

        setNewMemberName("")
        setIsAddMemberOpen(false)

        const ridersResult = await getTeamRiders(teamId)
        if (!ridersResult.error) {
            setRiders(ridersResult.riders)
        }
    }

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
            <button
                onClick={openAddMemberPopup}
                className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl py-2 text-sm mb-3">

                + Ajouter un membre

            </button>

            {isAddMemberOpen ? (
                <div
                    className="fixed inset-0 bg-black/40 flex items-center justify-center p-5"
                    onClick={function () { setIsAddMemberOpen(false) }}>

                    <div
                    className="bg-white dark:bg-gray-900 rounded-2xl p-5 w-full max-w-sm"
                    onClick={function (e) { e.stopPropagation() }}>

                    <div className="flex items-center justify-between mb-4">
                        <p className="font-medium text-lg">Ajouter un membre</p>
                        <button
                            onClick={function () { setIsAddMemberOpen(false) }}
                            aria-label="Fermer"
                            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-xl px-1">

                        ✕

                        </button>
                    </div>

                    {addMemberStep === "choose" ? (
                        <div className="flex flex-col gap-2">
                        <button
                            onClick={handleShowInviteCode}
                            className="w-full border border-gray-200 dark:border-gray-700 rounded-xl py-3 text-sm">

                            Inviter un membre

                        </button>
                        <button
                            onClick={function () { setAddMemberStep("create") }}
                            className="w-full border border-gray-200 dark:border-gray-700 rounded-xl py-3 text-sm">

                            Creer un membre

                        </button>
                        </div>
                    ) : null}

                    {addMemberStep === "invite" ? (
                        <div className="text-center">
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                            Code d'équipe
                        </p>
                        <p className="text-3xl font-medium tracking-widest">{teamJoinCode}</p>
                        </div>
                    ) : null}

                    {addMemberStep === "create" ? (
                        <div className="flex flex-col gap-3">
                        <input
                            value={newMemberName}
                            onChange={function (e) { setNewMemberName(e.target.value) }}
                            placeholder="Nom du rider"
                            autoComplete="off"
                            className="w-full border border-gray-200 dark:border-gray-700 rounded-lg p-2"
                        />
                        <button
                            onClick={handleCreateMember}
                            className="w-full bg-blue-600 text-white rounded-xl py-2 text-sm"
                        >
                            Creer
                        </button>
                        </div>
                    ) : null}

                    </div>
                </div>
                ) : null}

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
                    <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-300 flex items-center justify-center font-medium text-sm flex-shrink-0 overflow-hidden">
                        {rider.profile?.avatar_url ? (
                            <img src={rider.profile.avatar_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                            getInitials(rider.name)
                        )}
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