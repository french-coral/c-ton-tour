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

export default function ProfilePage() {
    const { t } = useLanguage()

    const [profile, setProfile] = useState(null)
    const [teamRider, setTeamRider] = useState(null)
    const [fullName, setFullName] = useState("")
    const [teamUsername, setTeamUsername] = useState("")
    const [isUploadingAvatar, setIsUploadingAvatar] = useState(false)

    const fileInputRef = useRef(null)

    useEffect(function () {
        async function loadData() {
            const profileResult = await getMyProfile()
            if (!profileResult.error) {
                setProfile(profileResult.profile)
                setFullName(profileResult.profile.username)
            }

            const teamRiderResult = await getMyTeamMembership()
            if (!teamRiderResult.error && teamRiderResult.teamRider) {
                setTeamRider(teamRiderResult.teamRider)
                setTeamUsername(teamRiderResult.teamRider.name)
            }
        }

        loadData()
    }, [])

    function getInitials(name) {
        if (!name) {
            return ""
        }
        const parts = name.trim().split(" ")
        const firstInitial = parts[0] ? parts[0][0] : ""
        const secondInitial = parts[1] ? parts[1][0] : ""
        return (firstInitial + secondInitial).toUpperCase()
    }

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
{/* Delete account */}
                <button className="text-xs text-gray-400 dark:text-gray-600 underline mt-6 self-center">
                    {t("profile_delete_account")}
                </button>

            </div>
        </div>
    )
}