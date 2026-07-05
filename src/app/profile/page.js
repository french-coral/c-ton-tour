"use client"

import { useEffect, useState, useRef } from "react"
import {
    getMyProfile,
    updateMyProfileName,
    uploadAvatar,
    getMyTeamMembership,
    updateMyTeamRiderName,
} from "@/lib/profile"
import { useLanguage } from "@/lib/LanguageContext"
import { useRouteGuard } from "@/lib/useRouteGuard"
import { logout, leaveTeam } from "@/lib/auth"
import { supabase } from "@/lib/supabase"
import { Settings } from "lucide-react"
import { useLockBodyScroll } from "@/lib/useLockBodyScroll"
import LanguageSwitcher from "@/components/LanguageSwitcher"

export default function ProfilePage() {

    // Route proofing
    const { isChecking } = useRouteGuard({ requireAuth: true })

    // Language module
    const { t } = useLanguage()

    // Profile
    const [profile, setProfile] = useState(null)
    const [teamRider, setTeamRider] = useState(null)
    const [fullName, setFullName] = useState("")
    const [teamUsername, setTeamUsername] = useState("")
    const [isUploadingAvatar, setIsUploadingAvatar] = useState(false)

    // Deletion variables
    const [isDeleteOpen, setIsDeleteOpen] = useState(false)
    const [deleteConfirmText, setDeleteConfirmText] = useState("")
    const [isDeletingAccount, setIsDeletingAccount] = useState(false)

    // Settings (delete, logout, legal)
    const [isSettingsOpen, setIsSettingsOpen] = useState(false)

    const fileInputRef = useRef(null)

    useLockBodyScroll(isDeleteOpen || isSettingsOpen)

/////////////////////////////////////////////////////////////
////	    		   	Base load						////
///////////////////////////////////////////////////////////

    useEffect(function () {
        async function loadData() {

            const profileResult = await getMyProfile()

            if (!profileResult.error && profileResult.profile) {
                setProfile(profileResult.profile)

                // Only update the field if the value is actually non-empty
                if (profileResult.profile.username) {
                    setFullName(profileResult.profile.username)
                }
            }

            const teamRiderResult = await getMyTeamMembership()

            if (!teamRiderResult.error && teamRiderResult.teamRider) {
                setTeamRider(teamRiderResult.teamRider)

                if (teamRiderResult.teamRider.name) {
                    setTeamUsername(teamRiderResult.teamRider.name)
                }
            }
        }

        loadData()
    }, [])

/////////////////////////////////////////////////////////////
////	    			   	Tools						////
///////////////////////////////////////////////////////////

    function getInitials(name) {
        if (!name) {
            return ""
        }
        const parts = name.trim().split(" ")
        const firstInitial = parts[0] ? parts[0][0] : ""
        const secondInitial = parts[1] ? parts[1][0] : ""
        return (firstInitial + secondInitial).toUpperCase()
    }


/////////////////////////////////////////////////////////////
////	         Account edit handling					////
///////////////////////////////////////////////////////////


    function handleClickEditAvatar() {
        fileInputRef.current.click()
    }

    async function handleAvatarFileChange(e) {
        const file = e.target.files[0]

        if (!file) {
            return
        }

        setIsUploadingAvatar(true)
        const result = await uploadAvatar(file)
        setIsUploadingAvatar(false)

        if (!result.error) {
            setProfile(function (previousProfile) {
            return { ...previousProfile, avatar_url: result.avatarUrl }
        })
        }
    }

    async function handleSaveFullName() {
        await updateMyProfileName(fullName)
    }

    async function handleSaveTeamUsername() {
        if (!teamRider) {
            return
        }
        await updateMyTeamRiderName(teamRider.id, teamUsername)
    }
    async function handleLogout() {
        await logout()
        window.location.href = "/login"
    }

    async function handleLeaveTeam() {
        const result = await leaveTeam()

        if (result.error) {
            console.error(result.error)
            return
        }

        window.location.href = "/team-setup"
    }

// Account deletion
    async function handleDeleteAccount() {
        if (deleteConfirmText !== "DELETE") {
            return
        }

        setIsDeletingAccount(true)

        // Get the current session token to send with the request
        const sessionResult = await supabase.auth.getSession()
        const token = sessionResult.data.session?.access_token

        if (!token) {
            setIsDeletingAccount(false)
            return
        }

        let response
        try {
            response = await fetch(
                "https://nfjnmqpluedjpzigfheu.supabase.co/functions/v1/delete-account",
                {
                method: "POST",
                headers: {
                    "Authorization": "Bearer " + token,
                    "Content-Type": "application/json",
                },
                }
            )
        } catch (err) {
            console.error("Fetch failed:", err)
            setIsDeletingAccount(false)
            return
        }

        console.log("Response status:", response.status)
        const result = await response.json()
        console.log("Response body:", result)

        if (result.error) {
            console.error(result.error)
            setIsDeletingAccount(false)
            return
        }

        // Account deleted — sign out locally and send them to signup
        await supabase.auth.signOut()
        window.location.href = "/signup"
    }


    if (isChecking) return null

    if (!profile) {
        return <p className="text-center mt-10 text-gray-500 dark:text-gray-400">{t("profile_loading")}</p>
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
{/* Profile picture */}                
            <div className="max-w-sm mx-auto flex flex-col gap-5">

                <div className="flex flex-col items-center mt-4">
                    <div className="relative">
                        <div className="w-24 h-24 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 flex items-center justify-center font-medium text-2xl overflow-hidden">
                            {profile.avatar_url ? (
                                <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
                            ) : (
                                getInitials(fullName)
                            )}
                        </div>

                        <button
                            onClick={handleClickEditAvatar}
                            aria-label={t("profile_edit_avatar")}
                            className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 flex items-center justify-center text-sm">

                        ✎

                        </button>

                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleAvatarFileChange}
                            className="hidden"/>
                    </div>

                    {isUploadingAvatar ? (
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">{t("profile_uploading")}</p>
                    ) : null}
                </div>
{/* Name of logged in user */}
                <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 p-4">
                    <label className="text-sm text-gray-500 dark:text-gray-400">{t("profile_full_name")}</label>
                    <input
                        value={fullName}
                        onChange={function (e) { setFullName(e.target.value) }}
                        onBlur={handleSaveFullName}
                        className="w-full bg-transparent border-b border-gray-200 dark:border-gray-700 py-1 mt-1 font-medium"
                    />
                </div>
{/* Current team */}
                <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 p-4">
                    <label className="text-sm text-gray-500 dark:text-gray-400">{t("profile_current_team")}</label>
                    <p className="font-medium mt-1">
                        {teamRider ? teamRider.team.name : t("profile_no_team")}
                    </p>
                </div>
{/* Team username */}

                {teamRider ? (
                    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 p-4">
                        <label className="text-sm text-gray-500 dark:text-gray-400">{t("profile_team_username")}</label>
                        <input
                            value={teamUsername}
                            onChange={function (e) { setTeamUsername(e.target.value) }}
                            onBlur={handleSaveTeamUsername}
                            className="w-full bg-transparent border-b border-gray-200 dark:border-gray-700 py-1 mt-1 font-medium"/>
                    </div>
                ) : null}

{/* Settings button */}
                <button
                    onClick={() => setIsSettingsOpen(true)}
                    className="fixed bottom-20 left-4 w-12 h-12 rounded-lg bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow flex items-center justify-center text-lg"
                >
                    <Settings className="text-gray-400 flex-shrink-0"></Settings>
                </button>

{/* Setting menu */}
                {isSettingsOpen ? (
                    <div
                        className="fixed inset-0 bg-black/40 flex items-center justify-center p-5 z-50"
                        onClick={() => setIsSettingsOpen(false)}
                    >
                        <div
                            className="bg-white dark:bg-gray-900 rounded-2xl p-5 w-full max-w-sm"
                            onClick={(e) => e.stopPropagation()}
                        >

                            {/* Header */}
                            <div className="flex items-center justify-between mb-4">
                                <p className="font-medium text-lg">Settings</p>

                                <button
                                    onClick={() => setIsSettingsOpen(false)}
                                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-xl px-1"
                                >
                                    ✕
                                </button>
                            </div>

                            <div className="flex flex-col gap-3">

{/* Legal */}
                                <a
                                    href="/legal"
                                    className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl py-3 text-sm font-medium text-center"
                                >
                                    {t("profile_legal_information")}
                                </a>

{/* Logout */}
                                <button
                                    onClick={handleLogout}
                                    className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl py-3 text-sm font-medium"
                                >
                                    {t("profile_logout")}
                                </button>

{/* Leave Team */}
                                {teamRider ? (
                                    <button
                                        onClick={function () {
                                        setIsSettingsOpen(false)
                                        handleLeaveTeam()
                                        }}
                                        className="w-full bg-transparent border border-orange-400 dark:border-orange-600 rounded-xl py-3 text-sm font-medium text-orange-500 dark:text-orange-400"
                                    >
                                        {t("profile_leave_team")}
                                    </button>
                                    ) : null}

{/* Delete account */}
                                <button
                                    onClick={function () {
                                        setIsSettingsOpen(false);
                                        setIsDeleteOpen(true);
                                    }}
                                    className="w-full bg-transparent border border-red-400 dark:border-red-600 rounded-xl py-3 text-sm font-medium text-red-500 dark:text-red-400"
                                >
                                    {t("profile_delete_account")}
                                </button>

                            </div>

{/* Footer */}
                            <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700 text-center text-xs text-gray-500">
                                © {new Date().getFullYear()} C-Ton-Tour
                            </div>

                        </div>
                    </div>
                ) : null}


                {isDeleteOpen ? (
                    <div
                        className="fixed inset-0 bg-black/40 flex items-center justify-center p-5"
                        onClick={function () {
                        setIsDeleteOpen(false)
                        setDeleteConfirmText("")
                        }}
                    >
                        <div
                            className="bg-white dark:bg-gray-900 rounded-2xl p-5 w-full max-w-sm"
                            onClick={function (e) { e.stopPropagation() }}
                        >
                        <div className="flex items-center justify-between mb-4">
                            <p className="font-medium text-lg">{t("profile_delete_title")}</p>
                            <button
                                onClick={function () {
                                    setIsDeleteOpen(false)
                                    setDeleteConfirmText("")
                                }}
                                aria-label={t("profile_close")}
                                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-xl px-1"
                            >

                            ✕

                            </button>
                        </div>

                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                            {t("profile_delete_warning")}
                        </p>

                        <div className="mb-4">
                            <label className="text-sm text-gray-500 dark:text-gray-400">
                                {t("profile_delete_instruction")}
                            </label>
                            <input
                                value={deleteConfirmText}
                                onChange={function (e) { setDeleteConfirmText(e.target.value) }}
                                placeholder="DELETE"
                                autoComplete="off"
                                className="w-full border border-gray-200 dark:border-gray-700 rounded-lg p-2 mt-1 font-mono text-sm tracking-widest"
                            />
                        </div>

                        <div className="flex gap-2">
                            <button
                                onClick={function () {
                                    setIsDeleteOpen(false)
                                    setDeleteConfirmText("")
                                }}
                                className="flex-1 border border-gray-200 dark:border-gray-700 rounded-xl py-2 text-sm"
                            >
                                {t("profile_cancel")}
                            </button>
                            <button
                                onClick={handleDeleteAccount}
                                disabled={deleteConfirmText !== "DELETE" || isDeletingAccount}
                                className="flex-1 bg-transparent border border-red-400 dark:border-red-600 rounded-xl py-2 text-sm font-medium text-red-500 dark:text-red-400 disabled:opacity-30 disabled:cursor-not-allowed"
                            >
                                {isDeletingAccount ? t("profile_deleting") : t("profile_delete_confirm")}
                            </button>
                        </div>

                        </div>
                    </div>
                ) : null}

{/* Language switcher */}

                <div className="fixed bottom-20 right-4">
                    <LanguageSwitcher />
                </div>

            </div>
        </div>
    )
}