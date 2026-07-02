"use client"

import { useState, useEffect } from "react"

export function useOnlineStatus() {
    const [isOnline, setIsOnline] = useState(true)

    useEffect(function () {
        // Set initial state correctly
        setIsOnline(navigator.onLine)

        function handleOnline() {
            setIsOnline(true)
        }

        function handleOffline() {
            setIsOnline(false)
        }

        window.addEventListener("online", handleOnline)
        window.addEventListener("offline", handleOffline)

        return function () {
            window.removeEventListener("online", handleOnline)
            window.removeEventListener("offline", handleOffline)
        }
    }, [])

    return isOnline
}