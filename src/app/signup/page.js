"use client"

import { signUp } from "@/lib/auth"
import { use, useState } from "react"

export default function SignUp(){
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [userName, setUsername] = useState("")
    const [errorMsg, setErrorMsg] = useState(null)

    async function handleSubmit(e) {
        e.preventDefault()
        console.log('submitting with:', email, password, userName)
        const { error } = await signUp(email, password, userName)
        if (error) setErrorMsg(error.message)
        else window.location.href = "/team-setup"
    }
    return (
        <form onSubmit={handleSubmit}>
            <input value={userName} onChange={(e) => setUsername(e.target.value)} placeholder="Nom d'utilisateur" autoComplete="off"/>
            <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="vive.leroller@example.fr" autoComplete="off"/>
            <input value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Mot de passe" autoComplete="off"/>
            <button type="submit">S'INSCRIRE</button>
            {errorMsg && <p>{errorMsg}</p>}
        </form>
    )
}