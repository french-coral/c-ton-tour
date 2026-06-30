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
} from "@/lib/queue"
import { useLockBodyScroll } from "@/lib/useLockBodyScroll"
import RiderDetailPopup from "@/components/RiderDetailPopup"
import QRCode from "react-qr-code"
import { useLanguage } from "@/lib/LanguageContext"


export default function TeamPage() {
    const { t } = useLanguage()

    const [teamName, setTeamName] = useState("")
    const [riders, setRiders] = useState([])
    const [selectedRider, setSelectedRider] = useState(null)
    const [selectedRiderStats, setSelectedRiderStats] = useState(null)

    const [isAddMemberOpen, setIsAddMemberOpen] = useState(false)
    const [addMemberStep, setAddMemberStep] = useState("choose")
    const [teamJoinCode, setTeamJoinCode] = useState(null)
    const [newMemberName, setNewMemberName] = useState("")

    useLockBodyScroll(selectedRider !== null)

    const TEAM_ID_NUMBER = "0b6b6787-0506-4a86-8fa1-cabc3f6b701c"


/////////////////////////////////////////////////////////////
////	    	  Realtime edit subscribing		    	////
///////////////////////////////////////////////////////////

    useEffect(function () {
        const teamId = TEAM_ID_NUMBER

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
    }, [])

    async function reloadRiders() {
        const teamId = TEAM_ID_NUMBER
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
        const teamId = TEAM_ID_NUMBER
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

        const teamId = TEAM_ID_NUMBER
        await addPlaceholderRider(teamId, newMemberName)

        setNewMemberName("")
        setIsAddMemberOpen(false)

        const ridersResult = await getTeamRiders(teamId)
        if (!ridersResult.error) {
            setRiders(ridersResult.riders)
        }
    }


/////////////////////////////////////////////////////////////
////	    	  Load base needed datas				////
///////////////////////////////////////////////////////////


    useEffect(function () {
        async function loadData() {
        const teamId = TEAM_ID_NUMBER

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
		const teamId = TEAM_ID_NUMBER
        await updateQueueByStatus(TEAM_ID_NUMBER)

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



    return (
        <div className="min-h-screen p-5 relative">
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

                    <div className={"w-7 h-7 rounded-lg flex items-center justify-center text-sm font-medium " + getStatusBadge(rider.status).bg + " " + getStatusBadge(rider.status).text}>
                        {getStatusBadge(rider.status).label}
                    </div>

                    {/*{rider.status !== "active" ? (
                    <span className="text-xs text-gray-400 dark:text-gray-500">
                        {rider.status === "left" ? "Parti" : "Inactif"}
                    </span>
                    ) : null}*/}

                </button>
                )
            })}
            </div>

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