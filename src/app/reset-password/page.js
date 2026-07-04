"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { useLanguage } from "@/lib/LanguageContext"

export default function ResetPassword() {
    const { t } = useLanguage()
    const [newPassword, setNewPassword] = useState("")
    const [confirmNewPassword, setConfirmNewPassword] = useState("")
    const [errorMsg, setErrorMsg] = useState(null)
    const [isDone, setIsDone] = useState(false)
    const [isReady, setIsReady] = useState(false)

    useEffect(function () {
        // Supabase embeds the session in the URL hash after clicking the reset link
        // onAuthStateChange picks it up automatically
        const { data: listener } = supabase.auth.onAuthStateChange(function (event) {
            if (event === "PASSWORD_RECOVERY") {
                setIsReady(true)
            }
        })

        return function () {
            listener.subscription.unsubscribe()
        }
    }, [])

    async function handleSubmit(e) {
        e.preventDefault()
        setErrorMsg(null)

        if (newPassword !== confirmNewPassword) {
            setErrorMsg(t("signup_passwords_dont_match"))
            return
        }

        const { error } = await supabase.auth.updateUser({ password: newPassword }) // To fix, the reset of avatar_url and username

        if (error) {
            setErrorMsg(error.message)
        } else {
            setIsDone(true)
            setTimeout(function () {
                window.location.href = "/"
        }, 2000)
        }
    }

    if (!isReady) {
        return <p className="text-center mt-10 text-gray-500 dark:text-gray-400">{t("reset_loading")}</p>
    }

    if (isDone) {
        return <p className="text-center mt-10 text-gray-500 dark:text-gray-400">{t("reset_success")}</p>
    }

    return (
        <div className="bg-gray-100 dark:bg-gray-950 min-h-screen p-5 flex flex-col items-center justify-center">
            <div className="max-w-sm w-full">
                <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 p-5 flex flex-col gap-3">
                    <p className="font-medium text-center">{t("reset_title")}</p>
                    <div>
                        <label className="text-sm text-gray-500 dark:text-gray-400">{t("reset_new_password")}</label>
                        <input
                            type="password"
                            value={newPassword}
                            onChange={function (e) { setNewPassword(e.target.value) }}
                            autoComplete="new-password"
                            className="w-full border border-gray-200 dark:border-gray-700 rounded-lg p-2 mt-1 bg-transparent"
                        />
                    </div>
                    <div>
                        <label className="text-sm text-gray-500 dark:text-gray-400">{t("reset_confirm_password")}</label>
                        <input
                            type="password"
                            value={confirmNewPassword}
                            onChange={function (e) { setConfirmNewPassword(e.target.value) }}
                            autoComplete="new-password"
                            className="w-full border border-gray-200 dark:border-gray-700 rounded-lg p-2 mt-1 bg-transparent"
                        />
                    </div>
                    <button type="submit" className="w-full bg-blue-600 text-white rounded-xl py-3 font-medium mt-2">
                        {t("reset_button")}
                    </button>
                    {errorMsg ? <p className="text-sm text-red-500 text-center">{errorMsg}</p> : null}
                </form>
            </div>
        </div>
    )
}