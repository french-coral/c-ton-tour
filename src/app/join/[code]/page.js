"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { getTeamByJoinCode } from "@/lib/auth"

export default function JoinPage() {
    const params = useParams()
    const joinCode = params.code

    const [isLoading, setIsLoading] = useState(true)
    const [isLoggedIn, setIsLoggedIn] = useState(false)
    const [team, setTeam] = useState(null)
    const [errorMsg, setErrorMsg] = useState(null)

    useEffect(function () {
        async function checkEverything() {
            const teamResult = await getTeamByJoinCode(joinCode)

            if (teamResult.error || !teamResult.team) {
                setErrorMsg("Ce lien d'invitation n'est plus valide")
                setIsLoading(false)
                return
            }

            setTeam(teamResult.team)

            const sessionResult = await supabase.auth.getSession()
            setIsLoggedIn(sessionResult.data.session !== null)
            setIsLoading(false)
        }

        checkEverything()
    }, [joinCode])

    function handleContinue() {
        // Remember which team they were trying to join,
        // so we can pick this back up after they sign up or log in
        sessionStorage.setItem("pendingJoinCode", joinCode)

        if (isLoggedIn) {
            window.location.href = "/profile-setup?code=" + joinCode
        } else {
            window.location.href = "/signup"
        }
    }

    if (isLoading) {
        return <p className="text-center mt-10 text-gray-500 dark:text-gray-400">Chargement...</p>
    }

    if (errorMsg) {
        return <p className="text-center mt-10 text-red-500">{errorMsg}</p>
    }

    return (
        <div className="bg-gray-100 dark:bg-gray-950 min-h-screen p-5 flex flex-col items-center justify-center">
            <div className="max-w-sm w-full bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 text-center">
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">On t'invite dans l'équipe </p>
                <p className="text-2xl font-medium mb-6">{team.name}</p>

                <button
                    onClick={handleContinue}
                    className="w-full bg-blue-600 text-white rounded-xl py-3 font-medium"
                >

                Rejoindre cette équipe

                </button>
            </div>
        </div>
    )
}