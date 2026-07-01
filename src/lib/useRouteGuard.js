"use client"

import { useEffect } from "react"
import { useTeam } from "@/lib/TeamContext"
import { supabase } from "@/lib/supabase"
import { useState } from "react"

// requireAuth: page needs a logged-in user
// requireTeam: page needs the user to be in a team
// requireNoAuth: page should not be accessible when logged in
// requireNoTeam: page should not be accessible when already in a team
export function useRouteGuard({ requireAuth, requireTeam, requireNoAuth, requireNoTeam }) {
    const { teamId, isLoadingTeam } = useTeam()
    const [isCheckingAuth, setIsCheckingAuth] = useState(true)
    const [isLoggedIn, setIsLoggedIn] = useState(false)

    useEffect(function () {
        async function checkAuth() {
            const sessionResult = await supabase.auth.getSession()
            const loggedIn = sessionResult.data.session !== null
            setIsLoggedIn(loggedIn)
            setIsCheckingAuth(false)
        }
        checkAuth()
    }, [])

    useEffect(function () {
        // Still loading — don't redirect yet
        if (isCheckingAuth || isLoadingTeam) {
            return
        }

        // Page requires being logged out (login, signup)
        if (requireNoAuth && isLoggedIn) {
            window.location.replace(teamId ? "/" : "/team-setup")
            return
        }

        // Page requires being logged in
        if (requireAuth && !isLoggedIn) {
            window.location.replace("/login")
            return
        }

        // Page requires having a team (team-list, main page)
        if (requireTeam && isLoggedIn && !teamId) {
            window.location.replace("/team-setup")
            return
        }

        // Page requires NOT having a team yet (team-setup)
        if (requireNoTeam && isLoggedIn && teamId) {
            window.location.replace("/")
            return
        }
    }, [isCheckingAuth, isLoadingTeam, isLoggedIn, teamId])

    // Returns true while checks are still running,
    // so the page can show nothing until we know what to do
    return { isChecking: isCheckingAuth || isLoadingTeam }
}