
import Link from "next/link";
import { 
    ShieldUser,
    Cookie,
    FileText,
    FileCode,
    ScrollText,
    Scale,

    
} from "lucide-react";

export default function LegalHub() {
    return (
        <div className="min-h-screen p-5 relative">

            {/* Background */}
            <div className="fixed inset-0 bg-gray-100 dark:bg-gray-950 z-[-2]" />

            {/* Center container */}
            <div className="max-w-sm mx-auto flex flex-col gap-5 pt-10">

                {/* Header */}
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                        Legal
                    </h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        Documents & policies
                    </p>
                </div>

                {/* Cards */}
                <div className="flex flex-col gap-3">
                    <Link
                        href="/legal/terms"
                        className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl p-4 flex items-center"
                    >
                        <FileText className="mr-2 w-5 h-5 text-gray-400 flex-shrink-0" />
                        <span className="font-medium flex-1 text-left">Terms of Use</span>
                        <span className="text-gray-400"> › </span>

                    </Link>

                    <Link href="/legal/privacy"
                        className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl p-4 flex items-center"
                    >
                        <ShieldUser className="mr-2 w-5 h-5 text-gray-400 flex-shrink-0" />
                        <span className="font-medium flex-1 text-left">Privacy Policy</span>
                        <span className="text-gray-400">›</span>
                    </Link>

                    <Link href="/legal/cookies"
                        className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl p-4 flex items-center"
                    >
                        <Cookie className="mr-2 w-5 h-5 text-gray-400 flex-shrink-0" />
                        <span className="font-medium flex-1 text-left">Cookie Policy</span>
                        <span className="text-gray-400">›</span>
                    </Link>

                    <Link href="/legal/acceptable-use"
                        className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl p-4 flex items-center"
                    >
                        <ScrollText className="mr-2 w-5 h-5 text-gray-400 flex-shrink-0" />
                        <span className="font-medium flex-1 text-left">Acceptable Use</span>
                        <span className="text-gray-400">›</span>
                    </Link>

                    <Link href="/legal/legal-notice"
                        className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl p-4 flex items-center"
                    >
                        <Scale className="mr-2 w-5 h-5 text-gray-400 flex-shrink-0" />
                        <span className="font-medium flex-1 text-left">Legal Notice</span>
                        <span className="text-gray-400">›</span>
                    </Link>

                    <Link href="/legal/open-source"
                        className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl p-4 flex items-center"
                    >
                        <FileCode className="mr-2 w-5 h-5 text-gray-400 flex-shrink-0" />
                        <span className="font-medium flex-1 text-left">Open Source</span>
                        <span className="text-gray-400">›</span>
                    </Link>

                </div>

                {/* Footer note */}
                <div className="text-center text-xs text-gray-500 dark:text-gray-400 mt-6">
                    C-Ton-Tour · Relay management platform
                </div>

            </div>
        </div>
    );
}