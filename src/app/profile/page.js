"use client"

import { useEffect, useState, useRef } from "react"
import {
    getMyProfile,
    updateMyProfileName,
    uploadAvatar,
    getMyTeamMembership,
    updateMyTeamRiderName,
} from "@/lib/profile"

export default function ProfilePage() {
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
        return <p className="text-center mt-10 text-gray-500 dark:text-gray-400">Chargement...</p>
    }

    return (
        <div className="bg-gray-100 dark:bg-gray-950 min-h-screen p-5">
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
                            aria-label="Changer la photo de profil"
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
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">Envoi en cours...</p>
                    ) : null}
                </div>

                <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 p-4">
                    <label className="text-sm text-gray-500 dark:text-gray-400">Nom complet</label>
                    <input
                        value={fullName}
                        onChange={function (e) { setFullName(e.target.value) }}
                        onBlur={handleSaveFullName}
                        className="w-full bg-transparent border-b border-gray-200 dark:border-gray-700 py-1 mt-1 font-medium"
                    />
                </div>

                <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 p-4">
                    <label className="text-sm text-gray-500 dark:text-gray-400">Equipe actuelle</label>
                    <p className="font-medium mt-1">
                        {teamRider ? teamRider.team.name : "Aucune equipe"}
                    </p>
                </div>

                {teamRider ? (
                    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 p-4">
                        <label className="text-sm text-gray-500 dark:text-gray-400">Pseudo d'équipe</label>
                        <input
                            value={teamUsername}
                            onChange={function (e) { setTeamUsername(e.target.value) }}
                            onBlur={handleSaveTeamUsername}
                            className="w-full bg-transparent border-b border-gray-200 dark:border-gray-700 py-1 mt-1 font-medium"/>
                    </div>
                ) : null}

                <button className="text-xs text-gray-400 dark:text-gray-600 underline mt-6 self-center">
                    Supprimer mon compte
                </button>

            </div>
        </div>
    )
}