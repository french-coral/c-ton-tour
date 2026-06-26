import { useEffect } from "react"

export function useLockBodyScroll(isLocked) {
  useEffect(function () {
    if (isLocked) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = ""
    }

    return function () {
      document.body.style.overflow = ""
    }
  }, [isLocked])
}