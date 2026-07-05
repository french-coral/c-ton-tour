"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { useLanguage } from "@/lib/LanguageContext"
import { Eye, EyeClosed } from "lucide-react"
import LanguageSwitcher from "@/components/LanguageSwitcher"
import Link from "next/link"

export default function ResetPassword() {
    const { t } = useLanguage()
    const [newPassword, setNewPassword] = useState("")
    const [confirmNewPassword, setConfirmNewPassword] = useState("")

    const [errorMsg, setErrorMsg] = useState(null)

    const [isDone, setIsDone] = useState(false)
    const [isReady, setIsReady] = useState(false)
    const [hasTimedOut, setHasTimedOut] = useState(false)

    const [passwordVisibility, setPasswordVisibility] = useState(false)

    useEffect(function () {
        async function checkSession() {
            const sessionResult = await supabase.auth.getSession()
            if (sessionResult.data.session) {
                setIsReady(true)
            } else {
                window.location.replace("/login")
            }
        }
        checkSession()
    }, [])

    useEffect(function () {
        async function init() {
        // Vérification instantanée : Est-ce qu'il y a une erreur d'authentification dans l'URL ?
            if (typeof window !== "undefined" && window.location.hash) {
                const hashParams = new URLSearchParams(window.location.hash.substring(1))

                if (hashParams.get("error_code") === "otp_expired") {
                    setHasTimedOut(true) // Bascule instantanément sur l'écran d'erreur
                    return
                }
            
                // If there's an access_token in the hash, set the session manually
                const accessToken = hashParams.get("access_token")
                const refreshToken = hashParams.get("refresh_token")

            

                if (accessToken && refreshToken) {
                    await supabase.auth.setSession({
                        access_token: accessToken,
                        refresh_token: refreshToken,
                    })
                    setIsReady(true)
                    return
                }
            }

            // Si aucune erreur, on lance le timeout
            const timer = setTimeout(function () {
                setHasTimedOut(true)
            }, 7000)

        
            const { data: listener } = supabase.auth.onAuthStateChange(function (event) {
                if (event === "PASSWORD_RECOVERY") {
                    clearTimeout(timer)
                    setIsReady(true)
                }
            })

            return function () {
                clearTimeout(timer)
                listener.subscription.unsubscribe()
            }
        }

        init()
    }, [])

    async function handleSubmit(e) {
        e.preventDefault()
        setErrorMsg(null)

        if (newPassword !== confirmNewPassword) {
            setErrorMsg(t("signup_passwords_dont_match"))
            return
        }

        const { error } = await supabase.auth.updateUser({ password: newPassword })

        if (error) {
            setErrorMsg(error.message)
        } else {
            setIsDone(true)
            setTimeout(function () {
                window.location.href = "/"
            }, 2000)
        }
    }

    function changePasswordVisibility(){
        setPasswordVisibility(prev => !prev)
    }

    if (!isReady) {
        return ( 
            <div className="bg-gray-100 dark:bg-gray-950 min-h-screen p-5 flex flex-col items-center justify-center">
                <div className="max-w-sm w-full flex flex-col items-center bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 shadow-sm">
                    <div className="fixed top-4 right-4 z-10">
                        <LanguageSwitcher />
                    </div>
                    
                    {hasTimedOut ? (
                        <p className="text-center text-red-500 font-medium">
                            {t("reset_link_expired_or_invalid")}
                        </p>
                    ) : (
                        <p className="text-center text-gray-500 dark:text-gray-400 animate-pulse">
                            {t("reset_loading")}
                        </p>
                    )}
                    
                    <button 
                        type="button"
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl py-3 font-medium mt-6 transition-colors"
                        onClick={function () { window.location.href = "/login" }}
                    >
                        {hasTimedOut ? t("reset_login_back") : t("reset_not_loading")}
                    </button>
                </div> 
            </div>
        )
    }

    if (isDone) {
        return <p className="text-center mt-10 text-gray-500 dark:text-gray-400">{t("reset_success")}</p>
    }

    return (
        <div className="bg-gray-100 dark:bg-gray-950 min-h-screen p-5 flex flex-col items-center justify-center">
            <div className="max-w-sm w-full">

                <div className="fixed top-4 right-4 z-10">
                        <LanguageSwitcher />
                </div>
                
                <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 p-5 flex flex-col gap-3">
                    <p className="font-medium text-center">{t("reset_title")}</p>
                    
                    <div className="relative">
                        <label className="text-sm text-gray-500 dark:text-gray-400">{t("reset_new_password")}</label>
                        <input
                            type={passwordVisibility ? "text" : "password" }
                            value={newPassword}
                            onChange={function (e) { setNewPassword(e.target.value) }}
                            autoComplete="new-password"
                            className="w-full border border-gray-200 dark:border-gray-700 rounded-lg p-2 mt-1 bg-transparent pr-10"
                        />
                        <button 
                            type="button"
                            className="absolute right-3 bottom-2.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                            title={t("signup_show_hide_password")}
                            onClick={changePasswordVisibility}
                        >
                            {passwordVisibility ? <Eye className="w-5 h-5" /> : <EyeClosed className="w-5 h-5" />}
                        </button>
                    </div>

                    <div className="relative">
                        <label className="text-sm text-gray-500 dark:text-gray-400">{t("reset_confirm_password")}</label>
                        <input
                            type={passwordVisibility ? "text" : "password" }
                            value={confirmNewPassword}
                            onChange={function (e) { setConfirmNewPassword(e.target.value) }}
                            autoComplete="new-password"
                            className="w-full border border-gray-200 dark:border-gray-700 rounded-lg p-2 mt-1 bg-transparent pr-10"
                        />
                        <button 
                            type="button"
                            className="absolute right-3 bottom-2.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                            title={t("signup_show_hide_password")}
                            onClick={changePasswordVisibility}
                        >
                            {passwordVisibility ? <Eye className="w-5 h-5" /> : <EyeClosed className="w-5 h-5" />}
                        </button>
                    </div>

                    <button type="submit" className="w-full bg-blue-600 text-white rounded-xl py-3 font-medium mt-2">
                        {t("reset_button")}
                    </button>
                    {errorMsg ? <p className="text-sm text-red-500 text-center">{errorMsg}</p> : null}
                </form>

                <Link href="/legal" className="underline text-sm text-gray-500 dark:text-gray-400 text-center mt-2 flex justify-center mt-10"> {t("legal_mentions")} </Link>
            </div>
        </div>
    )
}