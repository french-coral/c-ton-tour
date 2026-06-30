"use client"

import { createContext, useContext, useState, useEffect } from "react"
import { translations } from "./translations"

const LanguageContext = createContext(null)

export function LanguageProvider({ children }) {
    const [language, setLanguage] = useState("fr")

    useEffect(function () {
        // First, check if the person already chose a language before
        const savedLanguage = localStorage.getItem("preferredLanguage")

        if (savedLanguage) {
            setLanguage(savedLanguage)
            return
        }

        // Otherwise, detect it from the device/browser
        const browserLanguage = navigator.language || navigator.userLanguage

        if (browserLanguage.startsWith("fr")) {
            setLanguage("fr")
        } else {
            setLanguage("en")
        }
    }, [])

    function changeLanguage(newLanguage) {
        setLanguage(newLanguage)
        localStorage.setItem("preferredLanguage", newLanguage)
    }

    function t(key) {
        const dictionary = translations[language]
        return dictionary[key] || key
    }

    return (
        <LanguageContext.Provider value={{ language, changeLanguage, t }}>
            {children}
        </LanguageContext.Provider>
    )
}

export function useLanguage() {
    return useContext(LanguageContext)
}