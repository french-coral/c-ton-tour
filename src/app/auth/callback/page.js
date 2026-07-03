"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useLanguage } from "@/lib/LanguageContext"


export default function CallbackPage() {

    const router = useRouter();
    const { t } = useLanguage()

    useEffect(() => {
        async function handleAuth() {
            try {
                // First try to get session directly (important for implicit flow)
                const { data: sessionData } = await supabase.auth.getSession();

                if (sessionData?.session) {
                    router.replace("/email-confirmed");
                    return;
                }

                // Fallback: exchange code (PKCE flow)
                const { error } = await supabase.auth.exchangeCodeForSession(
                    window.location.href
                );

                if (error) {
                    console.error("Auth exchange error:", error);
                    router.replace("/login");
                    return;
                }

                // Re-check session after exchange
                const { data: finalSession } = await supabase.auth.getSession();

                if (finalSession?.session) {
                    router.replace("/email-confirmed");
                } else {
                    router.replace("/login");
                }

            } catch (err) {
                console.error("Callback error:", err);
                router.replace("/login");
            }
        }

        handleAuth();
    }, [router]);

    return (
        <div className="min-h-screen flex items-center justify-center">
            <p>{t("mail_await_sign_in")}</p>
        </div>
    );
}