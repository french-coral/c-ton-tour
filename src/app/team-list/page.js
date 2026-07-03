"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import {
  getTeamJoinCode,
  addPlaceholderRider,
} from "@/lib/auth"
import { 
    getTeamName, 
    getTeamRiders, 
    getRiderStats,  
    updateRiderStatus, 
    updateQueueByStatus,
    getTeamStats,
    deleteRider,
} from "@/lib/queue"
import { useLockBodyScroll } from "@/lib/useLockBodyScroll"
import RiderDetailPopup from "@/components/RiderDetailPopup"
import QRCode from "react-qr-code"
import { useLanguage } from "@/lib/LanguageContext"
import { useRouteGuard } from "@/lib/useRouteGuard"
import { useTeam } from "@/lib/TeamContext"
import { useLongPress } from "@/lib/useLongPress"
import RiderRow from "@/components/RiderRow"



export default function TeamPage() {

    // Route proofing
    const { isChecking } = useRouteGuard({ requireAuth: true, requireTeam: true })

    // Langaage module
    const { t } = useLanguage()

    // Team handling
    const [teamName, setTeamName] = useState(
        function () {
            if (typeof window !== "undefined") {
                return localStorage.getItem("cached_team_name") || ""
            }
                return ""
        }
    )
    const [riders, setRiders] = useState([])
    const [selectedRider, setSelectedRider] = useState(null)
    const [selectedRiderStats, setSelectedRiderStats] = useState(null)

    // Member joining handling
    const [isAddMemberOpen, setIsAddMemberOpen] = useState(false)
    const [addMemberStep, setAddMemberStep] = useState("choose")
    const [teamJoinCode, setTeamJoinCode] = useState(null)
    const [newMemberName, setNewMemberName] = useState("")

    // Team stats
    const [teamStats, setTeamStats] = useState(
        function () {
            if (typeof window !== "undefined") {
                const cached = localStorage.getItem("cached_team_stats")
                return cached ? JSON.parse(cached) : null
            }
                return null
        }
    )
    const [isStatsOpen, setIsStatsOpen] = useState(true)
    const [riderToDelete, setRiderToDelete] = useState(null)

    useLockBodyScroll(selectedRider !== null)

    const { teamId, isLoadingTeam } = useTeam()


/////////////////////////////////////////////////////////////
////	    	  Realtime edit subscribing		    	////
///////////////////////////////////////////////////////////


    // Reload on refocus on page
    useEffect(function () {
        function handleVisibilityChange() {
            if (document.visibilityState === "visible") {
                reloadRiders()
            }
        }

        document.addEventListener("visibilitychange", handleVisibilityChange)

        return function () {
            document.removeEventListener("visibilitychange", handleVisibilityChange)
        }
    }, [])

    useEffect(function () {

        if (!teamId) {
                return
        }

        const channel = supabase
            .channel('team-riders-updates-' + teamId)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'team_riders',
                    filter: 'team_id=eq.' + teamId,
                },
                function () {
                    reloadRiders()
                }
            )
            .subscribe()

        return function () {
            supabase.removeChannel(channel)
        }
    }, [teamId])



    async function reloadRiders() {
        const ridersResult = await getTeamRiders(teamId)
        if (!ridersResult.error) {
            setRiders(ridersResult.riders)
        }
    }


/////////////////////////////////////////////////////////////
////	    	   Handle member in and out		    	////
///////////////////////////////////////////////////////////
    

// used to mannually add a member
    function openAddMemberPopup() {
        setAddMemberStep("choose")
        setIsAddMemberOpen(true)
    }

    async function handleShowInviteCode() {
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

        await addPlaceholderRider(teamId, newMemberName)

        setNewMemberName("")
        setIsAddMemberOpen(false)

        const ridersResult = await getTeamRiders(teamId)
        if (!ridersResult.error) {
            setRiders(ridersResult.riders)
        }
    }

    async function handleConfirmDeleteRider() {
        if (!riderToDelete) return

        await deleteRider(riderToDelete.id)
        setRiderToDelete(null)

        const ridersResult = await getTeamRiders(teamId)
        if (!ridersResult.error) {
            setRiders(ridersResult.riders)
        }
    }


/////////////////////////////////////////////////////////////
////	    	  Load base needed datas				////
///////////////////////////////////////////////////////////


    useEffect(function () {

        if (!teamId) {
                return
        }

        async function loadData() {

            const nameResult = await getTeamName(teamId)
            if (!nameResult.error) {
                setTeamName(nameResult.name)
                localStorage.setItem("cached_team_name", nameResult.name)
            }

            const ridersResult = await getTeamRiders(teamId)
            if (!ridersResult.error) {
                setRiders(ridersResult.riders)
            }

            const statsResult = await getTeamStats(teamId)
            if (!statsResult.error) {
                setTeamStats(statsResult.stats)
                localStorage.setItem("cached_team_stats", JSON.stringify(statsResult.stats))
            }
        }

        loadData()
    }, [teamId])

/////////////////////////////////////////////////////////////
////	    	           	Tools       				////
///////////////////////////////////////////////////////////

    function getInitials(name) {
        const parts = name.trim().split(" ")
        const firstInitial = parts[0] ? parts[0][0] : ""
        const secondInitial = parts[1] ? parts[1][0] : ""
        return (firstInitial + secondInitial).toUpperCase()
    }

    function getStatusBadge(status) {
        if (status === "active") {
            return { label: "A", bg: "bg-green-100 dark:bg-green-900", text: "text-green-700 dark:text-green-300" }
        } else if (status === "inactive") {
            return { label: "R", bg: "bg-orange-100 dark:bg-orange-900", text: "text-orange-700 dark:text-orange-300" }
        } else {
            return { label: "I", bg: "bg-gray-100 dark:bg-gray-700", text: "text-gray-500 dark:text-gray-300" }
        }
    }

    function formatSeconds(totalSeconds) {
        const safeSeconds = Math.max(0, Math.round(totalSeconds))
        const heures = Math.floor(safeSeconds / 3600)
        const minutes = Math.floor(safeSeconds / 60)
        const seconds = safeSeconds % 60

        var formatted = String(minutes).padStart(2, "0") + ":" + String(seconds).padStart(2, "0")

        if (heures > 0) {
            formatted = String(heures) + ":" + String(minutes % 60).padStart(2, "0") + ":" + String(seconds).padStart(2, "0")
        }

        return formatted
    }

    function formatSpeed(kmh) {
        if (!kmh) return "--"
            return kmh.toFixed(1) + " km/h"
    }

    function formatDistance(km) {
        if (!km && km !== 0) return "--"
            return km.toFixed(2) + " km"
    }

    function formatElevation(meters) {
        if (!meters && meters !== 0) return "--"
            return Math.round(meters) + " m"
    }


/////////////////////////////////////////////////////////////
////	    	   	Handle rider windows				////
///////////////////////////////////////////////////////////


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


/////////////////////////////////////////////////////////////
////	    	   	Handle rider windows				////
///////////////////////////////////////////////////////////


    async function handleStatusChange(riderId, newStatus) {
		await updateRiderStatus(riderId, newStatus)
        await updateQueueByStatus(teamId)

		const ridersResult = await getTeamRiders(teamId)
		if (!ridersResult.error) {
			setRiders(ridersResult.riders)
		}
	}

/////////////////////////////////////////////////////////////
////	    	       	Joining tools   				////
///////////////////////////////////////////////////////////

    function getJoinUrl(joinCode) {
        return window.location.origin + "/join/" + joinCode
    }

    async function handleShareInvite(joinCode) {
        const url = getJoinUrl(joinCode)

        if (navigator.share) {
            await navigator.share({
            title: t("team_share_invite_title"),
            text: t("team_share_invite_text"),
            url: url,
            })
        } else if (navigator.clipboard) {
            await navigator.clipboard.writeText(url)
            alert(t("team_link_copied"))
        } else {
            alert(t("team_share_link_fallback") + url)
        }
    }

    if (isChecking) return null

    return (
        <div className="min-h-screen p-5 pb-28 relative overflow-x-hidden">
        <div className="fixed inset-0 bg-gray-100 dark:bg-gray-950 z-[-2]"/>


{/* Logo watermark */}
        <div className="flex justify-center">
            <div className="fixed inset-0 flex items-center justify-center pointer-events-none z-[-1]">
                    <img 
                        src="/ctt-logo.png"
                        className="w-auto h-60 object-contain opacity-2 dark:opacity-2" 
                        alt="back-logo"
                    />
            </div>
        </div>

        <div className="max-w-sm mx-auto">

{/* Logo and team name */}
            <div className="flex justify-center">
                <div className="relative w-50 h-24 flex items-center justify-center">
                        <div className="bg-white/80 dark:bg-gray-900/80 rounded-2xl border border-gray-200 dark:border-gray-800 px-4 py-2">
                            <h1 className="relative text-center text-xl font-medium">{teamName}</h1>
                        </div>
                        <img 
                            src="https://static.wixstatic.com/media/ca73d0_c6b9929de46744dd843625f3b2f98196~mv2.png/v1/fill/w_212,h_84,al_c,q_85,usm_0.66_1.00_0.01,enc_avif,quality_auto/Ruban%20BD.png"
                            className="absolute left-1/2 -translate-x-4 z-0 max-h-full object-contain opacity-80 z-[-1]" 
                            alt="Background Ribbon"
                        />
                </div>
            </div>
{/* Team stats panel */} 
            {teamStats ? (
                <div
                    onClick={function () { setIsStatsOpen(!isStatsOpen) }}
                    className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 mb-3 overflow-hidden cursor-pointer"
                >
                    <div className={"transition-all duration-300 ease-in-out " + (isStatsOpen ? "max-h-[400px] opacity-100" : "max-h-0 opacity-0")}>
                        <div className="grid grid-cols-3 gap-px bg-gray-100 dark:bg-gray-800">

                            <div className="bg-white dark:bg-gray-900 p-3 text-center">
                                <p className="text-sm font-medium">
                                    {teamStats.averageLapTime ? formatSeconds(teamStats.averageLapTime) : "--"}
                                </p>
                                <p className="text-[11px] text-gray-500 dark:text-gray-400">{t("team_stats_avg_time")}</p>
                            </div>

                            <div className="bg-white dark:bg-gray-900 p-3 text-center">
                                <p className="text-sm font-medium">
                                    {teamStats.totalLaps}
                                </p>
                                <p className="text-[11px] text-gray-500 dark:text-gray-400">{t("team_stats_total_laps")}</p>
                            </div>

                            <div className="bg-white dark:bg-gray-900 p-3 text-center">
                                <p className="text-sm font-medium">
                                    {teamStats.totalRelays}
                                </p>
                                <p className="text-[11px] text-gray-500 dark:text-gray-400">{t("team_stats_total_relays")}</p>
                            </div>

                            <div className="bg-white dark:bg-gray-900 p-3 text-center">
                                <p className="text-sm font-medium">
                                    {formatSpeed(teamStats.averageSpeed)}
                                </p>
                                <p className="text-[11px] text-gray-500 dark:text-gray-400">{t("team_stats_avg_speed")}</p>
                            </div>

                            <div className="bg-white dark:bg-gray-900 p-3 text-center">
                                <p className="text-sm font-medium">
                                    {formatDistance(teamStats.totalDistanceKm)}
                                </p>
                                <p className="text-[11px] text-gray-500 dark:text-gray-400">{t("team_stats_total_distance")}</p>
                            </div>

                            <div className="bg-white dark:bg-gray-900 p-3 text-center">
                                <p className="text-sm font-medium">
                                    {formatElevation(teamStats.totalElevationMeters)}
                                </p>
                            <p className="text-[11px] text-gray-500 dark:text-gray-400">{t("team_stats_total_elevation")}</p>
                            </div>

                        </div>
                    </div>

                    <div className="px-4 py-2 border-t border-gray-100 dark:border-gray-800">
                    <p className="text-xs text-gray-400 dark:text-gray-500 text-center">
                        {isStatsOpen ? t("team_stats_hide") : t("team_stats_show")}
                    </p>
                    </div>
                </div>
                ) : null}
{/* Add a member */}            
            <button
                onClick={openAddMemberPopup}
                className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl py-2 text-sm mb-3">

                {t("team_add_member")}

            </button>

            {isAddMemberOpen ? (
                <div
                    className="fixed inset-0 bg-black/40 flex items-center justify-center p-5"
                    onClick={function () { setIsAddMemberOpen(false) }}>

                    <div
                    className="bg-white dark:bg-gray-900 rounded-2xl p-5 w-full max-w-sm"
                    onClick={function (e) { e.stopPropagation() }}>

                    <div className="flex items-center justify-between mb-4">
                        <p className="font-medium text-lg">{t("team_add_member_title")}</p>
                        <button
                            onClick={function () { setIsAddMemberOpen(false) }}
                            aria-label={t("team_close")}
                            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-xl px-1">

                        ✕

                        </button>
                    </div>

                    {addMemberStep === "choose" ? (
                        <div className="flex flex-col gap-2">
                        <button
                            onClick={handleShowInviteCode}
                            className="w-full border border-gray-200 dark:border-gray-700 rounded-xl py-3 text-sm">

                            {t("team_invite_member")}

                        </button>
                        <button
                            onClick={function () { setAddMemberStep("create") }}
                            className="w-full border border-gray-200 dark:border-gray-700 rounded-xl py-3 text-sm">

                            {t("team_create_member")}

                        </button>
                        </div>
                    ) : null}
{/* Invite window /w invite code */}
                    {addMemberStep === "invite" ? (
                        <div className="text-center">
                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                            {t("team_invite_instructions")}
                            </p>
                            <p className="text-3xl font-medium tracking-widest mb-4">{teamJoinCode}</p>

                            <div className="flex justify-center mb-4">
                                <div className="bg-white p-3 rounded-xl">
                                    <QRCode value={getJoinUrl(teamJoinCode)} size={160} />
                                </div>
                            </div>

                            <button
                                onClick={function () { handleShareInvite(teamJoinCode) }}
                                className="w-full bg-blue-600 text-white rounded-xl py-2 text-sm"
                            >

                            {t("team_copy_link")}

                            </button>
                        </div>
                    ) : null}
{/*linked to an account */}
                    {addMemberStep === "create" ? (
                        <div className="flex flex-col gap-3">
                        <input
                            value={newMemberName}
                            onChange={function (e) { setNewMemberName(e.target.value) }}
                            placeholder={t("team_member_name_placeholder")}
                            autoComplete="off"
                            className="w-full border border-gray-200 dark:border-gray-700 rounded-lg p-2"
                        />
                        <button
                            onClick={handleCreateMember}
                            className="w-full bg-blue-600 text-white rounded-xl py-2 text-sm"
                        >
                            {t("team_create")}
                        </button>
                        </div>
                    ) : null}

                    </div>
                </div>
                ) : null}

            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700">
                {riders.map(function (rider, index) {
                    return (
                        <RiderRow
                            key={rider.id}
                            rider={rider}
                            index={index}
                            onOpen={handleOpenRider}
                            onLongPress={function (r) { setRiderToDelete(r) }}
                        />
                    )
                })}
            </div>
            {riderToDelete ? (
                <div
                    className="fixed inset-0 bg-black/40 flex items-center justify-center p-5 z-50"
                    onClick={function () { setRiderToDelete(null) }}
                >
                    <div
                        className="bg-white dark:bg-gray-900 rounded-2xl p-5 w-full max-w-sm"
                        onClick={function (e) { e.stopPropagation() }}
                    >
                        <p className="font-medium text-lg mb-2">{t("team_delete_rider_title")}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                            {t("team_delete_rider_warning")} <span className="font-medium text-gray-900 dark:text-white">{riderToDelete.name}</span>
                        </p>

                        <div className="flex gap-2">
                            <button
                                onClick={function () { setRiderToDelete(null) }}
                                className="flex-1 border border-gray-200 dark:border-gray-700 rounded-xl py-2 text-sm"
                            >
                                {t("main_cancel")}
                            </button>
                            <button
                                onClick={handleConfirmDeleteRider}
                                className="flex-1 bg-transparent border border-red-400 dark:border-red-600 rounded-xl py-2 text-sm font-medium text-red-500 dark:text-red-400"
                            >
                                {t("team_delete_rider_confirm")}
                            </button>
                        </div>
                    </div>
                </div>
            ) : null}
            {selectedRider ? (
            <RiderDetailPopup
                rider={selectedRider}
                stats={selectedRiderStats}
                onClose={handleClosePopup}
                onStatusChange={handleStatusChange}
                
            />
            ) : null}
        </div>
        </div>
    )
}