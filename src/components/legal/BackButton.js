"use client"

import { useRouter } from "next/navigation"
import { useLanguage } from "@/lib/LanguageContext"
import { ArrowLeft } from "lucide-react"

export default function BackButton({ fallbackHref = "/legal" }) {

    const router = useRouter()
    const { t } = useLanguage()

    function handleBack() {
        // In a PWA there's no browser history on first load,
        // so we check if there's history to go back to
        if (window.history.length > 1) {
            router.back()
        } else {
            router.push(fallbackHref)
        }
    }

    return (
        <button
            onClick={handleBack}
            className="flex items-center gap-1 text-base text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 mb-6"
        >
            <ArrowLeft></ArrowLeft> {t("legal_back")}
        </button>
    )
}