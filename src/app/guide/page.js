"use client"

import { useLanguage } from "@/lib/LanguageContext"
import { useRouter } from "next/navigation"
import { ChevronDown } from "lucide-react"
import { useState } from "react"
import LanguageSwitcher from "@/components/LanguageSwitcher"

function QnAItem({ question, answer }) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div
      className="border-b border-gray-100 dark:border-gray-800 last:border-b-0"
      onClick={function () { setIsOpen(!isOpen) }}
    >
      <div className="flex items-center justify-between px-4 py-3 cursor-pointer">
        <p className="text-sm font-medium">{question}</p>
        <ChevronDown
          size={16}
          className={"text-gray-400 transition-transform " + (isOpen ? "rotate-180" : "")}
        />
      </div>
      {isOpen ? (
        <p className="text-sm text-gray-500 dark:text-gray-400 px-4 pb-3 leading-relaxed">
          {answer}
        </p>
      ) : null}
    </div>
  )
}

export default function GuidePage() {
    const { t } = useLanguage()
    const router = useRouter()

    const sections = [
        {
        title: t("guide_section_getting_started"),
        items: [
            { q: t("guide_q_what_is_this"), a: t("guide_a_what_is_this") },
            { q: t("guide_q_how_to_start"), a: t("guide_a_how_to_start") },
            { q: t("guide_q_add_member"), a: t("guide_a_add_member") },
        ]
        },
        {
        title: t("guide_section_relay"),
        items: [
            { q: t("guide_q_how_relay_works"), a: t("guide_a_how_relay_works") },
            { q: t("guide_q_how_time_calculated"), a: t("guide_a_how_time_calculated") },
            { q: t("guide_q_wrong_runner"), a: t("guide_a_wrong_runner") },
            { q: t("guide_q_queue_empty"), a: t("guide_a_queue_empty") },
        ]
        },
        {
        title: t("guide_section_queue"),
        items: [
            { q: t("guide_q_queue_order"), a: t("guide_a_queue_order") },
            { q: t("guide_q_autofill"), a: t("guide_a_autofill") },
            { q: t("guide_q_change_laps"), a: t("guide_a_change_laps") },
        ]
        },
        {
        title: t("guide_section_stats"),
        items: [
            { q: t("guide_q_where_stats"), a: t("guide_a_where_stats") },
            { q: t("guide_q_export"), a: t("guide_a_export") },
            { q: t("guide_q_reset"), a: t("guide_a_reset") },
        ]
        },
    ]

    return (
        <div className="min-h-screen relative pb-10">
            <div className="fixed inset-0 bg-gray-100 dark:bg-gray-950 z-[-2]"/>
            <div className="max-w-sm mx-auto p-5">
                <div className="fixed top-4 right-4 z-10">
                    <LanguageSwitcher />
                </div>
                

                <div className="flex items-center gap-3 mb-6">
                    <button
                        onClick={function () { router.back() }}
                        className="text-gray-400 text-xl"
                    >
                        ←
                    </button>
                    <h1 className="font-medium text-lg">{t("guide_title")}</h1>
                </div>

                <div className="flex flex-col gap-4">
                {sections.map(function (section, sectionIndex) {
                    return (
                    <div
                        key={sectionIndex}
                        className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden"
                    >
                        <p className="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wide px-4 pt-3 pb-1">
                            {section.title}
                        </p>
                        {section.items.map(function (item, itemIndex) {
                            return (
                                <QnAItem
                                    key={itemIndex}
                                    question={item.q}
                                    answer={item.a}
                                />
                            )
                        })}
                    </div>
                    )
                })}
                </div>

            </div>
        </div>
    )
}