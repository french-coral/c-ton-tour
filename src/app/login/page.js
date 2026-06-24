"use client"

import { login, getMyTeamRider } from "@/lib/auth"
import { useState } from "react"

export default function Login(){
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [errorMsg, setErrorMsg] = useState(null)

    async function handleSubmit(e) {
        e.preventDefault()
        setErrorMsg(null)

        const { error } = await login(email, password)
        if (error) {
            setErrorMsg(error.message)
            return
        }
    
        const { data: rider} = await getMyTeamRider()
        window.location.href = rider ? "/" : "/team-setup"
    }

    return (
        <form onSubmit={handleSubmit}>
            <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="vive.leroller@example.fr"
                autoComplete="off"
            />
            <input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                autoComplete="off"
            />
            <button type="submit">SE CONNECTER</button>
            {errorMsg && <p>{errorMsg}</p>}
        </form>
    )

}