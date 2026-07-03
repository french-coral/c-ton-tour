import { useRef, useCallback } from "react"

export function useLongPress(onLongPress, duration = 600) {
    const timerRef = useRef(null)

    const start = useCallback(function () {
        timerRef.current = setTimeout(function () {
        onLongPress()
        }, duration)
    }, [onLongPress, duration])

    const cancel = useCallback(function () {
        if (timerRef.current) {
            clearTimeout(timerRef.current)
        }
    }, [])

    return {
        onTouchStart: start,
        onTouchEnd: cancel,
        onTouchMove: cancel,
        onMouseDown: start,
        onMouseUp: cancel,
        onMouseLeave: cancel,
    }
}