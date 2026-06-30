"use client"

import { createContext, useContext, useState, useEffect } from "react"
import { getMyTeamMembership } from "@/lib/profile"

const TeamContext = createContext(null)

export function TeamProvider({ children }) {
    const [teamId, setTeamId] = useState(null)
    const [teamRiderId, setTeamRiderId] = useState(null)
    const [isLoadingTeam, setIsLoadingTeam] = useState(true)

    useEffect(function () {
        async function loadTeam() {
            const result = await getMyTeamMembership()

            if (!result.error && result.teamRider) {
                setTeamId(result.teamRider.team.id)
                setTeamRiderId(result.teamRider.id)
            }

            setIsLoadingTeam(false)
        }

        loadTeam()
    }, [])

    return (
        <TeamContext.Provider value={{ teamId, teamRiderId, isLoadingTeam }}>
            {children}
        </TeamContext.Provider>
    )
}

export function useTeam() {
    return useContext(TeamContext)
}