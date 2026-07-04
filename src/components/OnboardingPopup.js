"use client"

export default function OnboardingPopup({ message, onDismiss }) {
    return (
      <div
        className="fixed inset-0 bg-black/40 flex items-end justify-center p-5 z-50"
        onClick={onDismiss}
      >
        <div
          className="bg-white dark:bg-gray-900 rounded-2xl p-5 w-full max-w-sm mb-20"
          onClick={function (e) { e.stopPropagation() }}
        >
          <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed mb-4">
            {message}
          </p>
          <button
            onClick={onDismiss}
            className="w-full bg-blue-600 text-white rounded-xl py-3 font-medium text-sm"
          >
            OK
          </button>
        </div>
      </div>
    )
}