"use client"

import { signUp } from "@/lib/auth"
import { useState } from "react"
import Link from "next/link"
import { Eye, EyeClosed } from "lucide-react"

export default function SignUp() {
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")
    const [username, setUsername] = useState("")
    const [passwordVisibility, setPasswordVisibility] = useState("false")
    const [errorMsg, setErrorMsg] = useState(null)

    async function handleSubmit(e) {
        e.preventDefault()
        setErrorMsg(null)

        if (password !== confirmPassword) {
        setErrorMsg("Les mots de passe ne correspondent pas")
        return
        }

        const { error } = await signUp(email, password, username)

        if (error) {
        setErrorMsg(error.message)
        } else {
        window.location.href = "/profile-setup"
        }
    }

    async function changePasswordVisibility(){
        if (passwordVisibility){
            setPasswordVisibility(false)
        } else {
            setPasswordVisibility(true)
        }
    }

    return (
        <div className="min-h-screen p-5 flex flex-col items-center justify-center">
        <div className="fixed inset-0 bg-gray-100 dark:bg-gray-950 z-[-2]"/>


            <div className="max-w-sm w-full">

                <div className="flex justify-center mb-9">
                    <div className="relative w-50 h-24 flex items-center justify-center mr-15">
                            <img 
                                src="https://static.wixstatic.com/media/ca73d0_90dadc8ab54f417c83c8afc52e11119c~mv2.png/v1/fill/w_290,h_97,al_c,q_85,usm_0.66_1.00_0.01,enc_avif,quality_auto/logo.png"
                                className="relative z-10 max-h-full object-contain"
                                alt="Logo"
                            />
                            <img 
                                src="https://static.wixstatic.com/media/ca73d0_c6b9929de46744dd843625f3b2f98196~mv2.png/v1/fill/w_212,h_84,al_c,q_85,usm_0.66_1.00_0.01,enc_avif,quality_auto/Ruban%20BD.png"
                                className="absolute left-1/2 -translate-x-4 z-0 max-h-full object-contain opacity-80" 
                                alt="Background Ribbon"
                            />
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 p-5 flex flex-col gap-3">

                <div>
                    <label className="text-sm text-gray-500 dark:text-gray-400">Pseudo</label>
                    <input
                        value={username}
                        onChange={function (e) { setUsername(e.target.value) }}
                        autoComplete="off"
                        className="w-full border border-gray-200 dark:border-gray-700 rounded-lg p-2 mt-1 bg-transparent"
                    />
                </div>

                <div>
                    <label className="text-sm text-gray-500 dark:text-gray-400">Email</label>
                    <input
                        type="email" 
                        inputMode="email"
                        value={email}
                        onChange={function (e) { setEmail(e.target.value) }}
                        autoComplete="off"
                        className="w-full border border-gray-200 dark:border-gray-700 rounded-lg p-2 mt-1 bg-transparent"
                    />
                </div>

                <div className="relative flex flex-col justify-center">
                    <div className="relative w-full">
                        <label className="text-sm text-gray-500 dark:text-gray-400">Mot de passe</label>
                        <input
                            value={password}
                            onChange={function (e) { setPassword(e.target.value) }}
                            type={passwordVisibility ? "password" : "" }
                            autoComplete="new-password"
                            className="w-full border border-gray-200 dark:border-gray-700 rounded-lg p-2 mt-1 bg-transparent"
                        />
                        
                        <button 
                            className="absolute right-3 bottom-2.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                            title="Show/Hide Password"
                            onClick={ () => changePasswordVisibility()}
                        >
                            {passwordVisibility ? 
                                <EyeClosed className="w-5 h-5" /> :
                                <Eye className="w-5 h-5" />
                            }

                        </button>
                    </div>
                </div>

                <div className="relative flex flex-col justify-center">
                    <div className="relative w-full">
                        <label className="text-sm text-gray-500 dark:text-gray-400">Confirme le mot de passe</label>
                        <input
                            value={confirmPassword}
                            onChange={function (e) { setConfirmPassword(e.target.value) }}
                            type={passwordVisibility ? "password" : "" }
                            autoComplete="new-password"
                            className="w-full border border-gray-200 dark:border-gray-700 rounded-lg p-2 mt-1 bg-transparent"
                        />
                        <button 
                            className="absolute right-3 bottom-2.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                            title="Show/Hide Password"
                            onClick={ () => changePasswordVisibility()}
                        >
                            {passwordVisibility ? 
                                <EyeClosed className="w-5 h-5" /> :
                                <Eye className="w-5 h-5" />
                            }

                        </button>
                    </div>
                </div>

                <button type="submit" className="w-full bg-blue-600 text-white rounded-xl py-3 font-medium mt-2">
                    S'inscrire
                </button>

                {errorMsg ? <p className="text-sm text-red-500 text-center">{errorMsg}</p> : null}

                <p className="text-sm text-gray-500 dark:text-gray-400 text-center mt-2">
                    Deja un compte ?{" "}
                    <Link href="/login" className="text-blue-600 font-medium">
                        Se connecter
                    </Link>
                </p>

                </form>

            </div>
        </div>
    )
}