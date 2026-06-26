"use client"

import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts"

export default function RiderDetailPopup({ rider, stats, onClose }) {

	function getInitials(name) {
		const parts = name.trim().split(" ")
		const firstInitial = parts[0] ? parts[0][0] : ""
		const secondInitial = parts[1] ? parts[1][0] : ""
		return (firstInitial + secondInitial).toUpperCase()
	}

	function formatSeconds(totalSeconds) {
		const safeSeconds = Math.max(0, Math.round(totalSeconds))
		const minutes = Math.floor(safeSeconds / 60)
		const seconds = safeSeconds % 60
		return String(minutes).padStart(2, "0") + ":" + String(seconds).padStart(2, "0")
	}

	function pluralizeTour(count) {
		if (count === 1) {
		return "tour"
		} else {
		return "tours"
		}
	}

	// recharts needs an array of plain objects, one per point on the curve
	const chartPoints = stats
		? stats.chartData.map(function (point, index) {
			return {
			label: "Tour " + (index + 1),
			pace: Math.round(point.pace),
			}
		})
		: []

	return (
		<div
		className="fixed inset-0 bg-black/40 flex items-center justify-center p-5"
		onClick={onClose}
		>
		<div
			className="bg-white dark:bg-gray-900 rounded-2xl p-5 w-full max-w-sm max-h-[85vh] overflow-y-auto"
			onClick={function (e) { e.stopPropagation() }}
		>

			<div className="flex items-center justify-between mb-4">
				<div className="flex items-center gap-3">
					<div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 flex items-center justify-center font-medium text-base flex-shrink-0 overflow-hidden">
						{rider.profile?.avatar_url ? (
							<img src={rider.profile.avatar_url} alt="" className="w-full h-full object-cover" />
						) : (
							getInitials(rider.name)
						)}
					</div>
					<p className="font-medium text-lg">{rider.name}</p>
				</div>
				<button
					onClick={onClose}
					aria-label="Fermer"
					className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-xl px-1"
				>
					✕
				</button>
			</div>

			{!stats ? (
			<p className="text-gray-500 dark:text-gray-400 text-sm">Chargement...</p>
			) : (
			<>

				<div className="grid grid-cols-3 gap-2 mb-4">
				<div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3 text-center">
					<p className="text-sm font-medium">
					{stats.averagePace ? formatSeconds(stats.averagePace) : "--"}
					</p>
					<p className="text-[11px] text-gray-500 dark:text-gray-400">Moyenne / tour</p>
				</div>
				<div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3 text-center">
					<p className="text-sm font-medium">{stats.totalLaps}</p>
					<p className="text-[11px] text-gray-500 dark:text-gray-400">
					{pluralizeTour(stats.totalLaps)} au total
					</p>
				</div>
				<div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3 text-center">
					<p className="text-sm font-medium">
					{stats.lastLapTime ? formatSeconds(stats.lastLapTime) : "--"}
					</p>
					<p className="text-[11px] text-gray-500 dark:text-gray-400">Dernier tour</p>
				</div>
				</div>

				{chartPoints.length > 1 ? (
				<div className="mb-4" style={{ width: "100%", height: 140 }}>
					<ResponsiveContainer width="100%" height="100%">
					<LineChart data={chartPoints}>
						<XAxis dataKey="label" hide={true} />
						<YAxis hide={true} />
						<Tooltip formatter={function (value) { return formatSeconds(value) }} />
						<Line type="monotone" dataKey="pace" stroke="#2563eb" strokeWidth={2} dot={false} />
					</LineChart>
					</ResponsiveContainer>
				</div>
				) : null}

				<p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
				Historique
				</p>

				<div className="border border-gray-200 dark:border-gray-700 rounded-2xl">
				{stats.laps.length === 0 ? (
					<p className="text-sm text-gray-500 dark:text-gray-400 p-4">
					Aucun tour enregistré
					</p>
				) : (
					stats.laps.map(function (lap, index) {
					return (
						<div
						key={lap.id}
						className={
							index === 0
							? "flex items-center justify-between px-4 py-3"
							: "flex items-center justify-between px-4 py-3 border-t border-gray-100 dark:border-gray-800"
						}
						>
						<p className="text-sm">{lap.lap_count} {pluralizeTour(lap.lap_count)}</p>
						<p className="text-sm font-medium">{formatSeconds(lap.time_seconds)}</p>
						</div>
					)
					})
				)}
				</div>

			</>
			)}

		</div>
		</div>
	)
}