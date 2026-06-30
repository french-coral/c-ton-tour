"use client"

import { useState, useEffect } from "react"
import {
  createTeam,
  joinTeam,
  getTeamByJoinCode,
  getUnclaimedRiders,
  claimRider,
} from "@/lib/auth"
import { updateMyTeamRiderName } from "@/lib/profile"
import { getMyProfile } from "@/lib/profile"
import { useSearchParams } from "next/navigation"
import { useLanguage } from "@/lib/LanguageContext"
import LanguageSwitcher from "@/components/LanguageSwitcher"


export default function TeamSetup() {
    const { t } = useLanguage()

    const [mode, setMode] = useState("create")

    // Create-team fields
    const [teamName, setTeamName] = useState("")
    const [createUsername, setCreateUsername] = useState("")

    // Join flow, step by step
    const [joinStep, setJoinStep] = useState("enterCode")
    const [joinCode, setJoinCode] = useState("")
    const [foundTeam, setFoundTeam] = useState(null)
    const [unclaimedRiders, setUnclaimedRiders] = useState([])
    const [selectedRiderToClaim, setSelectedRiderToClaim] = useState(null)
    const [finalUsername, setFinalUsername] = useState("")

    const [errorMsg, setErrorMsg] = useState(null)

    const searchParams = useSearchParams()

    useEffect(function () {
        async function loadDefaultUsername() {
        const profileResult = await getMyProfile()
        if (!profileResult.error) {
            setCreateUsername(profileResult.profile.username)
            setFinalUsername(profileResult.profile.username)
        }
        }
        loadDefaultUsername()
    }, [])

    // trynna fetch the code from url
    useEffect(function () {
        const codeFromUrl = searchParams.get("code")
        if (codeFromUrl) {
            setMode("join")
            setJoinCode(codeFromUrl)
            sessionStorage.removeItem("pendingJoinCode")
        }
    }, [])

    async function handleCreateTeam(e) {
        e.preventDefault()
        setErrorMsg(null)

        const result = await createTeam(teamName, createUsername)

        if (result.error) {
        setErrorMsg(result.error.message)
        } else {
        window.location.href = "/"
        }
    }

    async function handleSubmitJoinCode(e) {
        e.preventDefault()
        setErrorMsg(null)

        const teamResult = await getTeamByJoinCode(joinCode)

        if (teamResult.error || !teamResult.team) {
        setErrorMsg(t("teamsetup_invalid_code"))
        return
        }

        const unclaimedResult = await getUnclaimedRiders(teamResult.team.id)

        setFoundTeam(teamResult.team)
        setUnclaimedRiders(unclaimedResult.riders || [])
        setJoinStep("claimChoice")
    }

    function handleSelectExistingRider(rider) {
        setSelectedRiderToClaim(rider)
        setFinalUsername(rider.name)
        setJoinStep("confirmClaim")
    }

    function handleSelectNewMember() {
        setSelectedRiderToClaim(null)
        setJoinStep("newMemberUsername")
    }

    async function handleConfirmClaim() {
        if (!selectedRiderToClaim) {
            setErrorMsg(t("teamsetup_claim_error"))
            setJoinStep("claimChoice")
            return
        }

        setErrorMsg(null)
        const claimResult = await claimRider(selectedRiderToClaim.id)

        if (claimResult.error) {
            setErrorMsg(claimResult.error.message)
            return
        }

        if (finalUsername !== selectedRiderToClaim.name) {
            await updateMyTeamRiderName(selectedRiderToClaim.id, finalUsername)
        }

        window.location.href = "/"
    }

    async function handleConfirmNewMember() {
        setErrorMsg(null)

        const result = await joinTeam(joinCode, finalUsername)

        if (result.error) {
        setErrorMsg(result.error.message)
        } else {
        window.location.href = "/"
        }
    }

    return (
        <div className="min-h-screen p-5 flex flex-col items-center justify-center">
            <div className="fixed inset-0 bg-gray-100 dark:bg-gray-950 z-[-2]"/>
            <div className="max-w-sm w-full">
                <div className="fixed top-4 right-4 z-10">
                     <LanguageSwitcher />
                </div>

                <h1 className="text-xl font-medium text-center mb-5">{t("teamsetup_title")}</h1>

                <div className="flex gap-2 mb-4">
                    <button
                        onClick={function () { setMode("create") }}
                        className={
                        mode === "create"
                            ? "flex-1 bg-blue-600 text-white rounded-xl py-2 text-sm font-medium"
                            : "flex-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl py-2 text-sm text-gray-500 dark:text-gray-400"
                        }
                    >
                        {t("teamsetup_create_tab")}
                    </button>
                    <button
                        onClick={function () { setMode("join") }}
                        className={
                        mode === "join"
                            ? "flex-1 bg-blue-600 text-white rounded-xl py-2 text-sm font-medium"
                            : "flex-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl py-2 text-sm text-gray-500 dark:text-gray-400"
                        }
                    >
                        {t("teamsetup_join_tab")}
                    </button>
                </div>

                {mode === "create" ? (
                <form onSubmit={handleCreateTeam} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 p-5 flex flex-col gap-3">
                    <div>
                        <label className="text-sm text-gray-500 dark:text-gray-400">{t("teamsetup_username_label")}</label>
                        <input
                            value={createUsername}
                            onChange={function (e) { setCreateUsername(e.target.value) }}
                            autoComplete="off"
                            className="w-full border border-gray-200 dark:border-gray-700 rounded-lg p-2 mt-1"
                        />
                    </div>
                    <div>
                        <label className="text-sm text-gray-500 dark:text-gray-400">{t("teamsetup_team_name_label")}</label>
                        <input
                            value={teamName}
                            onChange={function (e) { setTeamName(e.target.value) }}
                            autoComplete="off"
                            className="w-full border border-gray-200 dark:border-gray-700 rounded-lg p-2 mt-1"
                        />
                    </div>
                    <button type="submit" className="w-full bg-blue-600 text-white rounded-xl py-3 font-medium mt-2">
                        {t("teamsetup_create_button")}
                    </button>
                    {errorMsg ? <p className="text-sm text-red-500 text-center">{errorMsg}</p> : null}
                </form>
                ) : null}

                {mode === "join" && joinStep === "enterCode" ? (
                <form onSubmit={handleSubmitJoinCode} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 p-5 flex flex-col gap-3">
                    <div>
                        <label className="text-sm text-gray-500 dark:text-gray-400">{t("teamsetup_join_code_label")}</label>
                        <input
                            value={joinCode}
                            onChange={function (e) { setJoinCode(e.target.value.toUpperCase()) }}
                            autoCapitalize="characters"
                            inputMode="text"
                            autoComplete="off"
                            className="w-full border border-gray-200 dark:border-gray-700 rounded-lg p-2 mt-1"
                        />
                    </div>
                    <button type="submit" className="w-full bg-blue-600 text-white rounded-xl py-3 font-medium mt-2">
                        {t("teamsetup_next")}
                    </button>
                    {errorMsg ? <p className="text-sm text-red-500 text-center">{errorMsg}</p> : null}
                </form>
                ) : null}

                {mode === "join" && joinStep === "claimChoice" ? (
                <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 p-5 flex flex-col gap-3">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                    {t("teamsetup_are_you_member")} {foundTeam.name} ?
                    </p>

                    {unclaimedRiders.map(function (rider) {
                    return (
                        <button
                        key={rider.id}
                        onClick={function () { handleSelectExistingRider(rider) }}
                        className="w-full border border-gray-200 dark:border-gray-700 rounded-lg py-2 text-sm"
                        >
                        {rider.name}
                        </button>
                    )
                    })}

                    <button
                        onClick={handleSelectNewMember}
                        className="w-full border border-gray-200 dark:border-gray-700 rounded-lg py-2 text-sm text-gray-500 dark:text-gray-400 mt-1"
                    >
                        {t("teamsetup_not_a_member")}
                    </button>
                </div>
                ) : null}

                {mode === "join" && joinStep === "confirmClaim" ? (
                <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 p-5 flex flex-col gap-3">
                    <label className="text-sm text-gray-500 dark:text-gray-400">{t("teamsetup_username_label")}</label>
                    <input
                        value={finalUsername}
                        onChange={function (e) { setFinalUsername(e.target.value) }}
                        autoComplete="off"
                        className="w-full border border-gray-200 dark:border-gray-700 rounded-lg p-2"
                    />
                    <button onClick={handleConfirmClaim} className="w-full bg-blue-600 text-white rounded-xl py-3 font-medium mt-2">
                        {t("teamsetup_join_button")}
                    </button>
                    {errorMsg ? <p className="text-sm text-red-500 text-center">{errorMsg}</p> : null}
                </div>
                ) : null}

                {mode === "join" && joinStep === "newMemberUsername" ? (
                    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 p-5 flex flex-col gap-3">
                        <label className="text-sm text-gray-500 dark:text-gray-400">{t("teamsetup_username_label")}</label>
                        <input
                            value={finalUsername}
                            onChange={function (e) { setFinalUsername(e.target.value) }}
                            autoComplete="off"
                            className="w-full border border-gray-200 dark:border-gray-700 rounded-lg p-2"
                        />
                        <button onClick={handleConfirmNewMember} className="w-full bg-blue-600 text-white rounded-xl py-3 font-medium mt-2">
                            {t("teamsetup_join_button")}
                        </button>
                        {errorMsg ? <p className="text-sm text-red-500 text-center">{errorMsg}</p> : null}
                    </div>
                ) : null}

            </div>
        </div>
    )
}