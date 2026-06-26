import "./globals.css"
import BottomNav from "@/components/BottomNav"

export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <body className="pb-20">
        {children}
        <BottomNav />
      </body>
    </html>
  )
}