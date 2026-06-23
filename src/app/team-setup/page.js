"use client"

import { createTeam, joinTeam } from "@/lib/auth"
import { useState } from "react"

export default function TeamSetup(){
    const [mode, setMode] = useState("create") // "create" or "join"
    const [teamName, setTeamName] = useState("")
    const [joinCode, setJoinCode] = useState("")
    const [username, setUsername] = useState("")
    const [errorMsg, setErrorMsg] = useState(null)

    async function handleSubmit(e){
        e.preventDefault()
        setErrorMsg(null)

        const result = mode === "create"
            ? await createTeam(teamName, username)
            : await joinTeam(joinCode, username)

        if (result.error) setErrorMsg(result.error.message)
        else window.location.href = "/"
    }

    return (
        <div>
            <button onClick={() => setMode("create")} disabled={mode === "create"}>
                Créer une équipe
            </button>
            <button onClick={() => setMode("join")} disabled={mode === "join"}>
                Rejoindre une équipe (code)
            </button>

            <form onSubmit={handleSubmit}>
                <input 
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Pseudo d'équipe"
                    autoComplete="off"
                />

                {mode === "create" ? (
                    <input 
                        value={teamName}
                        onChange={(e) => setTeamName(e.target.value)}
                        placeholder="Nom de l'équipe"
                        autoComplete="off"
                    />
                ): (
                    <input 
                        value={joinCode}
                        onChange={(e) => setJoinCode(e.target.value)}
                        placeholder="Code d'équipe"
                        autoComplete="off"
                    />
                    )
                }
                <button type="submit">
                    {mode === "create" ? "Créer" : "Rejoindre"}
                </button>
                
                {errorMsg && <p>{errorMsg}</p>}

            </form>
        </div>
    )

}