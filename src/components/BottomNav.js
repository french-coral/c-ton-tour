"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { User, Timer, Users } from "lucide-react"

export default function BottomNav() {

  const currentPath = usePathname()

  const isProfileActive = currentPath === "/profile"
  const isMainActive = currentPath === "/"
  const isTeamActive = currentPath === "/team-list"

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 px-6 pt-2 pb-4">
      <div className="flex items-center justify-between max-w-sm mx-auto">

        <Link href="/profile" className="flex flex-col items-center gap-1 flex-1">
          <User
            size={22}
            className={isProfileActive ? "text-gray-900 dark:text-white" : "text-gray-400 dark:text-gray-500"}
          />
          <span className={isProfileActive ? "text-[11px] font-medium text-gray-900 dark:text-white" : "text-[11px] text-gray-400 dark:text-gray-500"}>
            Profil
          </span>
        </Link>

        <Link href="/" className="flex flex-col items-center gap-1 flex-1">
          <Timer
            size={22}
            className={isMainActive ? "text-gray-900 dark:text-white" : "text-gray-400 dark:text-gray-500"}
          />
          <span className={isMainActive ? "text-[11px] font-medium text-gray-900 dark:text-white" : "text-[11px] text-gray-400 dark:text-gray-500"}>
            Course
          </span>
        </Link>

        <Link href="/team-list" className="flex flex-col items-center gap-1 flex-1">
          <Users
            size={22}
            className={isTeamActive ? "text-gray-900 dark:text-white" : "text-gray-400 dark:text-gray-500"}
          />
          <span className={isTeamActive ? "text-[11px] font-medium text-gray-900 dark:text-white" : "text-[11px] text-gray-400 dark:text-gray-500"}>
            Equipe
          </span>
        </Link>
      </div>
    </div>
  )
}