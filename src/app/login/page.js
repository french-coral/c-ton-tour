"use client"

import { login, getMyTeamRider } from "@/lib/auth"
import { useState } from "react"
import Link from "next/link"
import { Eye, EyeClosed } from "lucide-react"
import { useLanguage } from "@/lib/LanguageContext"
import LanguageSwitcher from "@/components/LanguageSwitcher"

export default function Login() {
    // t() nous donne le bon texte selon la langue active (fr ou en)
    const { t } = useLanguage()

    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    // Controle si le mot de passe est cache ("password") ou visible ("text")
    const [passwordVisibility, setPasswordVisibility] = useState("false")
    const [errorMsg, setErrorMsg] = useState(null)

    async function handleSubmit(e) {
        // Empeche le comportement par defaut du form (reload complet de la page)
        e.preventDefault()
        setErrorMsg(null)

        // Tente la connexion via Supabase Auth (fonction definie dans auth.js)
        const { error } = await login(email, password)
        if (error) {
        // Si Supabase renvoie une erreur (mauvais mdp, email inconnu, etc.)
        // on l'affiche directement a l'utilisateur et on arrete ici
        setErrorMsg(error.message)
        return
        }

        // Connexion reussie : on regarde si la personne a deja un rider
        // associe a une equipe. Si oui -> page principale, sinon -> creation/jonction d'equipe
        const { data: rider } = await getMyTeamRider()
        window.location.href = rider ? "/" : "/team-setup"
    }

    // Inverse simplement l'etat actuel de visibilite du mot de passe
    async function changePasswordVisibility(){
        if (passwordVisibility){
            setPasswordVisibility(false)
        } else {
            setPasswordVisibility(true)
        }
    }

    return (
        <div className="min-h-screen p-5 flex flex-col items-center justify-center">
  {/* Fond plein ecran, place en arriere-plan (z-[-2]) derriere tout le contenu */}
        <div className="fixed inset-0 bg-gray-100 dark:bg-gray-950 z-[-2]"/>
            
            <div className="max-w-sm w-full">
            <div className="fixed top-4 right-4 z-10">
                <LanguageSwitcher />
            </div>
  {/* Logo + ruban decoratif superposes derriere */}
                <div className="flex justify-center mb-9">
                    <div className="relative w-50 h-24 flex items-center justify-center mr-15">
                            <img 
                                src="https://static.wixstatic.com/media/ca73d0_90dadc8ab54f417c83c8afc52e11119c~mv2.png/v1/fill/w_290,h_97,al_c,q_85,usm_0.66_1.00_0.01,enc_avif,quality_auto/logo.png"
                                className="relative z-10 max-h-full object-contain"
                                alt="Logo"
                            />
                            <img 
                                src="https://static.wixstatic.com/media/ca73d0_c6b9929de46744dd843625f3b2f98196~mv2.png/v1/fill/w_212,h_84,al_c,q_85,usm_0.66_1.00_0.01,enc_avif,quality_auto/Ruban%20BD.png"
                                className="absolute left-1/2 -translate-x-4 z-0 max-h-full object-contain opacity-80" 
                                alt="Background Ribbon"
                            />
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 p-5 flex flex-col gap-3">

                <div>
                    <label className="text-sm text-gray-500 dark:text-gray-400">{t("login_email_label")}</label>
                    <input
                        value={email}
                        type="email" 
                        inputMode="email"
                        onChange={function (e) { setEmail(e.target.value) }}
                        autoComplete="off"
                        className="w-full border border-gray-200 dark:border-gray-700 rounded-lg p-2 mt-1 bg-transparent"
                    />
                </div>

                <div className="relative flex flex-col justify-center">
                    <div className="relative w-full">
                        <label className="text-sm text-gray-500 dark:text-gray-400">{t("login_password_label")}</label>
                        <input
                            value={password}
                            onChange={function (e) { setPassword(e.target.value) }}
                            // Le type bascule entre "password" (points caches) et "" selon le bouton oeil
                            type={passwordVisibility ? "password" : "" }
                            autoComplete="new-password"
                            className="w-full border border-gray-200 dark:border-gray-700 rounded-lg p-2 mt-1 bg-transparent"
                        />
                        
                        <button 
                            className="absolute right-3 bottom-2.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                            title={t("login_show_hide_password")}
                            onClick={ () => changePasswordVisibility()}
                        >
                            {passwordVisibility ? 
                                <EyeClosed className="w-5 h-5" /> :
                                <Eye className="w-5 h-5" />
                            }

                        </button>
                    </div>
                </div>

                <button type="submit" className="w-full bg-blue-600 text-white rounded-xl py-3 font-medium mt-2">
                    {t("login_button")}
                </button>

                {errorMsg ? <p className="text-sm text-red-500 text-center">{errorMsg}</p> : null}

                <p className="text-sm text-gray-500 dark:text-gray-400 text-center mt-2">
                    {t("login_no_account")}{" "}
                    {/* Link de Next.js : navigue sans recharger toute la page */}
                    <Link href="/signup" className="text-blue-600 font-medium">
                        {t("login_signup_link")}
                    </Link>
                </p>

                </form>

            </div>
        </div>
    )
}