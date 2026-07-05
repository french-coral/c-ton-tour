"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { useLanguage } from "@/lib/LanguageContext"

export default function CallbackPage() {
    const router = useRouter()
    const { t } = useLanguage()

    useEffect(function () {
        async function handleAuth() {
            try {
                // Read the type from URL params — tells us why we're here
                const urlParams = new URLSearchParams(window.location.search)
                const flowType = urlParams.get("type")

                // First try existing session (implicit flow)
                const { data: sessionData } = await supabase.auth.getSession()

                if (sessionData?.session) {
                    if (flowType === "recovery") {
                        router.replace("/reset-password")
                        return
                    }

                    // Check for pending join code before redirecting
                    const pendingJoinCode = sessionStorage.getItem("pendingJoinCode")
                    if (pendingJoinCode) {
                        router.replace("/team-setup?code=" + pendingJoinCode)
                        return
                    }

                    router.replace("/email-confirmed")
                    return
                }

                // Fallback: PKCE code exchange
                const { error } = await supabase.auth.exchangeCodeForSession(
                    window.location.href
                )

                if (error) {
                    console.error("Auth exchange error:", error)
                    router.replace("/login")
                    return
                }

                // Re-check session after exchange
                const { data: finalSession } = await supabase.auth.getSession()

                if (finalSession?.session) {
                    if (flowType === "recovery") {
                        router.replace("/reset-password")
                        return
                    }

                    const pendingJoinCode = sessionStorage.getItem("pendingJoinCode")
                    if (pendingJoinCode) {
                        router.replace("/team-setup?code=" + pendingJoinCode)
                        return
                    }

                    router.replace("/email-confirmed")
                } else {
                    router.replace("/login")
                }

            } catch (err) {
                console.error("Callback error:", err)
                router.replace("/login")
            }
        }

        handleAuth()
    }, [router])

    return (
        <div className="min-h-screen flex items-center justify-center">
            <p>{t("mail_await_sign_in")}</p>
        </div>
    )
}