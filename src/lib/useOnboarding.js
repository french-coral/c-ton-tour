import { useState, useEffect } from "react"

export function useOnboarding(key) {
    const [shouldShow, setShouldShow] = useState(false)

    useEffect(function () {
        const alreadySeen = localStorage.getItem("onboarding_" + key)
        if (!alreadySeen) {
            setShouldShow(true)
        }
    }, [key])

    function dismiss() {
        localStorage.setItem("onboarding_" + key, "true")
        setShouldShow(false)
    }

    return { shouldShow, dismiss }
}