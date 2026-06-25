"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { getTeamState, getRiderAverageLapTime, getAverageLapTimesForRiders  } from "@/lib/queue"

export default function MainPage() {
	const [team, setTeam] = useState(null)
  	const [queue, setQueue] = useState([])
	const [averagesByRiderId, setAveragesByRiderId] = useState({})
	const [elapsedSeconds, setElapsedSeconds] = useState(0)
	const [isQueueOpen, setIsQueueOpen] = useState(false)

	// Load the team's current state once when the page opens
	useEffect(() => {
		async function loadData() {
		// For now hardcoded a team id, this will come from the logged in user later
		const teamId = "0b6b6787-0506-4a86-8fa1-cabc3f6b701c"

		const stateResult = await getTeamState(teamId)

		if (stateResult.error) {
			console.error(stateResult.error)
			return
      	}

		setTeam(stateResult.team)
      	setQueue(stateResult.queue)

		// Gather every rider id we will need an average for:
		// the current runner, plus everyone in the queue
		const riderIds = []

		if (stateResult.team.current_rider) {
			riderIds.push(stateResult.team.current_rider.id)
		}

		for (const queueEntry of stateResult.queue) {
			riderIds.push(queueEntry.team_rider.id)
		}


		if (riderIds.length > 0) {
			const averagesResult = await getAverageLapTimesForRiders(riderIds)
			if (!averagesResult.error) {
				setAveragesByRiderId(averagesResult.averages)
			}
		}
		
		}

		loadData()
	}, [])

	// Every second, recalculate how much time has elapsed
	useEffect(() => {
		if (!team || !team.current_leg_started_at) {
		return
		}

		const intervalId = setInterval(() => {
		const startTime = new Date(team.current_leg_started_at)
		const now = new Date()
		const secondsPassed = Math.floor((now - startTime) / 1000)
		setElapsedSeconds(secondsPassed)
		}, 1000)

		// Cleanup: stop the timer if this component disappears from screen
		return () => clearInterval(intervalId)
	}, [team])

	if (!team) {
		return <p className="text-center mt-10 text-gray-500">Chargement...</p>
	}

	  // Format a number of seconds as mm:ss
	function formatSeconds(totalSeconds) {
		const safeSeconds = Math.max(0, Math.round(totalSeconds))
		const heures = Math.floor(safeSeconds / 3600)
		const minutes = Math.floor(safeSeconds / 60)
		const seconds = safeSeconds % 60
	

		var formattedElapsed = String(minutes).padStart(2, "0") + ":" + String(seconds).padStart(2, "0")

		// Show hours if needed
		if (heures > 0){
			formattedElapsed = String(heures).padStart(1, "0") + ":" + String(minutes % 60).padStart(2, "0") + ":" + String(seconds).padStart(2, "0")
		}

		return formattedElapsed
	}


		// Helper: turns a rider's name into initials, for the avatar circle
	function getInitials(name) {
		const parts = name.trim().split(" ")
		const firstInitial = parts[0] ? parts[0][0] : ""
		const secondInitial = parts[1] ? parts[1][0] : ""
		return (firstInitial + secondInitial).toUpperCase()
	}


	// Figure out how much time is left on the CURRENT leg
	let remainingOnCurrentLeg = 0

	if (team.current_rider) {
		const currentAverage = averagesByRiderId[team.current_rider.id]

		if (currentAverage) {
			const predictedTotalSeconds = currentAverage * team.current_leg_lap_count
			remainingOnCurrentLeg = predictedTotalSeconds - elapsedSeconds
		}
	}

	// Walk through the queue, building up a cumulative ETA for each entry
	// Each rider's ETA is: everything before them, plus their own predicted leg time
	const queueWithEtas = []
	let cumulativeSeconds = remainingOnCurrentLeg

	for (const queueEntry of queue) {
		const etaForThisEntry = cumulativeSeconds

		queueWithEtas.push({ //Queue made of dict with riders infos
			id: queueEntry.id,
			riderName: queueEntry.team_rider.name,
			lapCount: queueEntry.lap_count,
			etaSeconds: etaForThisEntry,
		})

		const riderAverage = averagesByRiderId[queueEntry.team_rider.id]

		if (riderAverage) {
			cumulativeSeconds = cumulativeSeconds + riderAverage * queueEntry.lap_count
		}
	}

	const nextEntry = queueWithEtas.length > 0 ? queueWithEtas[0] : null



	return (
		<div className="bg-gray-100 dark:bg-gray-800 min-h-screen p-5">
			<div className="max-w-sm mx-auto">

				<h1 className="text-center text-xl font-medium mb-4">{team.name}</h1>

				<div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 p-5 mb-3">
					<p className="text-sm text-gray-500 dark:text-gray-400 mb-3">En course</p>

					{team.current_rider ? (
						<div className="flex items-center gap-3 mb-4">
							<div className="w-13 h-13 w-[52px] h-[52px] rounded-full bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 flex items-center justify-center font-medium text-base flex-shrink-0">
								{getInitials(team.current_rider.name)}
							</div>
							<div>
								<p className="font-medium text-lg">{team.current_rider.name}</p>
								<p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
								{team.current_leg_lap_count} tours prevus
								</p>
							</div>
						</div>
					) : (
						<p className="text-gray-500 dark:text-gray-400 mb-4">Personne ne court actuellement</p>
					)}

					<div className="flex items-center gap-2 border-t border-gray-200 dark:border-gray-700 pt-3">
						<span className="text-sm text-gray-500 dark:text-gray-400">Temps ecoule</span>
						<span className="text-xl font-medium ml-auto">{formatSeconds(elapsedSeconds)}</span>
					</div>
				</div>

				<div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 px-5 py-4 mb-3">
					{nextEntry ? (
						<div className="flex items-center gap-3">
							<div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 flex items-center justify-center font-medium text-sm flex-shrink-0">
								{getInitials(nextEntry.riderName)}
							</div>
						<div className="flex-1">
							<p className="text-sm text-gray-500 dark:text-gray-400">Suivant</p>
							<p className="font-medium text-sm mt-0.5">{nextEntry.riderName}</p>
						</div>
						<div className="text-right">
							<p className="text-sm text-gray-500 dark:text-gray-400">Dans</p>
							<p className="font-medium text-sm mt-0.5">~ {formatSeconds(nextEntry.etaSeconds)}</p>
						</div>
						</div>
					) : (
						<p className="text-gray-500 dark:text-gray-400">La file d'attente est vide</p>
					)}
				</div>

				<button
				onClick={function () { setIsQueueOpen(true) }}
				className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 dark:border-gray-800 rounded-xl py-3 font-medium text-sm hover:bg-gray-50">
				Voir la file d'attente
				</button>

				{isQueueOpen ? (
				<div className="fixed inset-0 bg-black/40 flex items-center justify-center p-5">
					<div className="bg-white dark:bg-gray-900 rounded-2xl p-5 w-full max-w-sm max-h-[80vh] overflow-y-auto">
						<div className="flex items-center justify-between mb-4">
							<p className="font-medium text-lg">File d'attente</p>
							<button
							onClick={function () { setIsQueueOpen(false) }}
							className="text-gray-500 dark:text-gray-400 text-sm">
							Fermer
							</button>
						</div>

						<div className="flex flex-col gap-2">
							{queueWithEtas.map(function (entry) {
							return (
								<div
								key={entry.id}
								className="flex items-center gap-3 border border-gray-100 dark:border-gray-800 rounded-xl px-3 py-2">
									<div className="w-9 h-9 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 flex items-center justify-center font-medium text-xs flex-shrink-0">
										{getInitials(entry.riderName)}
									</div>
									<div className="flex-1">
										<p className="font-medium text-sm">{entry.riderName}</p>
										<p className="text-xs text-gray-500 dark:text-gray-400">{entry.lapCount} tours</p>
									</div>
									<p className="text-sm font-medium">~ {formatSeconds(entry.etaSeconds)}</p>
								</div>
							)
							})}
						</div>
					</div>
				</div>
				) : null}

			</div>
		</div>
	)
}