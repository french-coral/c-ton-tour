"use client"

import { useLanguage } from "@/lib/LanguageContext"

export default function LanguageSwitcher() {
    const { language, changeLanguage } = useLanguage()

    return (
         <div className="inline-flex bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full p-0.5 gap-0.5">
            <button
                onClick={function () { changeLanguage("fr") }}
                className={
                    language === "fr"
                        ? "bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-full px-3 py-1 text-xs font-medium text-gray-900 dark:text-white"
                        : "rounded-full px-3 py-1 text-xs text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
                }
            >
                FR
            </button>
            <button
                onClick={function () { changeLanguage("en") }}
                className={
                    language === "en"
                        ? "bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-full px-3 py-1 text-xs font-medium text-gray-900 dark:text-white"
                        : "rounded-full px-3 py-1 text-xs text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
                }
            >
                EN
            </button>
        </div>
    )
}