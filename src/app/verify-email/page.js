"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useLanguage } from "@/lib/LanguageContext"
import LanguageSwitcher from "@/components/LanguageSwitcher"

function VerifyEmailInner() {
    const searchParams = useSearchParams();
    const email = searchParams.get("email");

    const { t } = useLanguage()

    const [checking, setChecking] = useState(true);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const interval = setInterval(async () => {
            const {
                data: { user },
            } = await supabase.auth.getUser();

            if (user?.email_confirmed_at) {
                clearInterval(interval)
                const pendingCode = sessionStorage.getItem("pendingJoinCode")
                
                if (pendingCode) {
                    window.location.href = "/team-setup?code=" + pendingCode
                } else {
                    window.location.href = "/team-setup"
                }
            }

            setChecking(false);
        }, 3000);

            return () => clearInterval(interval);
    }, []);

    async function resendEmail() {
        setLoading(true);

        await supabase.auth.resend({
            type: "signup",
            email,
        });

        setLoading(false);
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-950 p-6">
            <div className="max-w-md w-full text-center bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-8 shadow-sm">

                <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
                    {t("mail_check_email")}
                </h1>

                <p className="mt-4 text-gray-600 dark:text-gray-400">
                    {t("mail_link_sent")}
                </p>

                <p className="font-semibold mt-2 text-gray-900 dark:text-gray-100">
                    {email}
                </p>

                <button
                    onClick={resendEmail}
                    disabled={loading}
                    className="mt-6 inline-block bg-blue-600 text-white px-5 py-2 rounded-xl font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                    {loading 
                        ? t("mail_sending_email") 
                        : t("mail_resend_email")
                    }
                </button>

                <p className="mt-6 text-sm text-gray-500 dark:text-gray-400">
                    {t("mail_page_update")}
                </p>

                {checking && (
                    <div className="mt-4 text-sm text-gray-400 dark:text-gray-500 animate-pulse">
                        {t("mail_check_verification")}
                    </div>
                )}

            </div>
        </div>
    );
}

export default function VerifyEmail() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-950">
                <div className="animate-pulse text-gray-500">Loading...</div>
            </div>
        }>
            <VerifyEmailInner />
        </Suspense>
    )
}