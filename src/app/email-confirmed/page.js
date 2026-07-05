"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/lib/LanguageContext"
import { CircleCheck } from "lucide-react";


export default function EmailConfirmed() {

    const { t } = useLanguage()
    const router = useRouter();

    useEffect(() => {
        const timer = setTimeout(() => {
            // Preserve the pending join code through login
            const pendingCode = sessionStorage.getItem("pendingJoinCode")
            if (pendingCode) {
                router.push("/login?pendingCode=" + pendingCode)
            } else {
                router.push("/login")
            }
        }, 10000)

        return () => clearTimeout(timer)
    }, [router])

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-950 p-6">
            <div className="max-w-md w-full text-center bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-8 shadow-sm">

                <div className="text-5xl mb-4 flex justify-center "><CircleCheck className="w-10 h-10"/></div>

                <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
                    {t("mail_confirmed")}
                </h1>

                <p className="mt-4 text-gray-600 dark:text-gray-400">
                    {t("mail_verified_success")}
                    <br />
                    {t("mail_return_to_app")}
                </p>

                <Link
                    href={
                        typeof window !== "undefined" && sessionStorage.getItem("pendingJoinCode")
                            ? "/login?pendingCode=" + sessionStorage.getItem("pendingJoinCode")
                            : "/login"
                    }
                    className="mt-6 inline-block bg-blue-600 text-white px-5 py-2 rounded-xl font-medium hover:bg-blue-700"
                >
                    {t("mail_go_to_app_link")}
                </Link>

            </div>
        </div>
    );
}