"use client"

import { useOnlineStatus } from "@/lib/useOnlineStatus"
import { useLanguage } from "@/lib/LanguageContext"
import { useEffect } from "react"
import { WifiOff } from "lucide-react"

export default function OfflineBanner() {

    // Hooks
    const isOnline = useOnlineStatus()
    const { t } = useLanguage()

    useEffect(function () {
        if (!isOnline) {
            document.body.style.paddingTop = "36px"
        } else {
            document.body.style.paddingTop = ""
        }

        return function () {
            document.body.style.paddingTop = ""
        }
    }, [isOnline])

    if (isOnline) {
        return null
    }

    return (
        <div className="fixed top-0 left-0 right-0 z-50 flex items-center justify-center gap-2 bg-orange-500 text-white text-sm font-medium py-2 px-4">
        <span><WifiOff></WifiOff></span>
        <span>{t("offline_warning")}</span>
        </div>
    )
}