"use client"

import { useState, useRef } from "react"
import { getMyProfile, uploadAvatar } from "@/lib/profile"
import { useEffect } from "react"

export default function ProfileSetup() {
  const [profile, setProfile] = useState(null)
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false)
  const fileInputRef = useRef(null)

  useEffect(function () {
    async function loadData() {
      const profileResult = await getMyProfile()
      if (!profileResult.error) {
        setProfile(profileResult.profile)
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

  function handleContinue() {
    window.location.href = "/team-setup"
  }

  if (!profile) {
    return <p className="text-center mt-10 text-gray-500 dark:text-gray-400">Chargement...</p>
  }

  return (
    <div className="bg-gray-100 dark:bg-gray-950 min-h-screen p-5 flex flex-col items-center justify-center">
      <div className="max-w-sm w-full flex flex-col items-center gap-5">

        <p className="text-xl font-medium">Ajoute une photo</p>
        <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
          (Optionel)
        </p>

        <div className="relative">
          <div className="w-28 h-28 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 flex items-center justify-center font-medium text-3xl overflow-hidden">
            {profile.avatar_url ? (
              <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
            ) : (
              getInitials(profile.username)
            )}
          </div>

          <button
            onClick={handleClickEditAvatar}
            aria-label="Changer la photo de profil"
            className="absolute bottom-0 right-0 w-9 h-9 rounded-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 flex items-center justify-center text-base"
          >
            ✎
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleAvatarFileChange}
            className="hidden"
          />
        </div>

        {isUploadingAvatar ? (
          <p className="text-xs text-gray-500 dark:text-gray-400">Envoi en cours...</p>
        ) : null}

        <button
          onClick={handleContinue}
          className="w-full bg-blue-600 text-white rounded-xl py-3 font-medium mt-4"
        >
          Continuer
        </button>

      </div>
    </div>
  )
}