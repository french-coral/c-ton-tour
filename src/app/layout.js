import "./globals.css"
import BottomNav from "@/components/BottomNav"
import { LanguageProvider } from "@/lib/LanguageContext"

export const metadata = {
	title: "CTonTour",
	description: "Suivi en direct du relai.",
	manifest: "/manifest.json",
	appleWebApp: {
		capable: true,
		statusBarStyle: "default",
		title: "CTonTour",
	},
}


export default function RootLayout({ children }) {
	return (
		<html lang="fr">
		<head>
			<link rel="apple-touch-icon" href="/icon-192.png" />
		</head>
		<body className="pb-20">
			<LanguageProvider>
				{children}
				<BottomNav />
			</LanguageProvider>
		</body>
		</html>
	)
}