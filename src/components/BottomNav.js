"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { User, Timer, Users } from "lucide-react"
import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { useLanguage } from "@/lib/LanguageContext"

export default function BottomNav() {

	const { t } = useLanguage()

	const currentPath = usePathname()
	const [isLoggedIn, setIsLoggedIn] = useState(false)

	useEffect(function () {
		async function checkSession() {
			const sessionResult = await supabase.auth.getSession()
			setIsLoggedIn(sessionResult.data.session !== null)
		}

		checkSession()

		// Also listen for login/logout happening WHILE this component is mounted,
		// so the bar appears/disappears immediately without needing a page reload
		const { data: authListener } = supabase.auth.onAuthStateChange(function (event, session) {
		setIsLoggedIn(session !== null)
		})

		return function () {
			authListener.subscription.unsubscribe()
		}
	}, [])

	if (!isLoggedIn) {
		return null
	}

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
						{t("nav_profile")}
					</span>
				</Link>

				<Link href="/" className="flex flex-col items-center gap-1 flex-1">
					<Timer
						size={22}
						className={isMainActive ? "text-gray-900 dark:text-white" : "text-gray-400 dark:text-gray-500"}
					/>
					<span className={isMainActive ? "text-[11px] font-medium text-gray-900 dark:text-white" : "text-[11px] text-gray-400 dark:text-gray-500"}>
						{t("nav_race")}
					</span>
				</Link>

				<Link href="/team-list" className="flex flex-col items-center gap-1 flex-1">
					<Users
						size={22}
						className={isTeamActive ? "text-gray-900 dark:text-white" : "text-gray-400 dark:text-gray-500"}
					/>
					<span className={isTeamActive ? "text-[11px] font-medium text-gray-900 dark:text-white" : "text-[11px] text-gray-400 dark:text-gray-500"}>
						{t("nav_team")}
					</span>
				</Link>
			</div>
		</div>
	)
}