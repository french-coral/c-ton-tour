"use client"


/////////////////////////////////////////////////////////////
////	        Import functions and const 			    ////
///////////////////////////////////////////////////////////

import { useEffect, useState, useRef } from "react"
import { supabase } from "@/lib/supabase"
import {
  getTeamState,
  getAverageLapTimesForRiders,
  logLapAndAdvance,
  getActiveRiders,
  reorderQueue,
  removeFromQueue,
  updateQueueEntryLapCount,
  addToQueue,
  updateCurrentRider,
  updateCurrentLegLapCount,
  getPastLaps,
  setAutoFill,
  replenishQueueIfNeeded,
  setAutoFillTarget,
  emptyQueue,
  updateLapTime,
  updateQueueByStatus,
  startEvent,
  startNextRiderInQueue,
} from "@/lib/queue"
// Draggable
import { DndContext, closestCenter } from "@dnd-kit/core"
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable"
import { useLockBodyScroll } from "@/lib/useLockBodyScroll"
import { SlidersHorizontal, Check, X } from "lucide-react"
import QueueItem from "@/components/QueueItem"
import { useLanguage } from "@/lib/LanguageContext"
import { useRouteGuard } from "@/lib/useRouteGuard"
import { useTeam } from "@/lib/TeamContext"
import { useOnboarding } from "@/lib/useOnboarding"
import OnboardingPopup from "@/components/OnboardingPopup"



export default function MainPage() {

	// Route proofing
	const { isChecking } = useRouteGuard({ requireAuth: true, requireTeam: true })

	// Le hook de traduction, dispo partout dans le composant
	const { t } = useLanguage()

	// Base team and UI values
	const [team, setTeam] = useState(null)
  	const [queue, setQueue] = useState([])
	const [averagesByRiderId, setAveragesByRiderId] = useState({})
	const [elapsedSeconds, setElapsedSeconds] = useState(0)
	const [isQueueOpen, setIsQueueOpen] = useState(false)

	// Add lap value
	const [isAddLapOpen, setIsAddLapOpen] = useState(false)
	const [selectedRiderId, setSelectedRiderId] = useState("")
	const [lapCount, setLapCount] = useState(1)
	const [finishTime, setFinishTime] = useState("")
	const [activeRiders, setActiveRiders] = useState([])

	// Queue adding value
	const [isAddingToQueue, setIsAddingToQueue] = useState(false)
	const [riderToAdd, setRiderToAdd] = useState("")
	const [lapCountToAdd, setLapCountToAdd] = useState(1)
	const [isReplenishing, setIsReplenishing] = useState(false)

	// Event start and stop
	const [isStartEventOpen, setIsStartEventOpen] = useState(false)
	const [startRiderId, setStartRiderId] = useState("")
	const [startLapCount, setStartLapCount] = useState(1)

	// Onboarding
	const { shouldShow, dismiss } = useOnboarding("main")

	// Current rider editing
	const [isEditingCurrentRider, setIsEditingCurrentRider] = useState(false)
	const [editedRiderId, setEditedRiderId] = useState("")
	const [editedLapCount, setEditedLapCount] = useState(1)

	// Queue content
	const [isQueueSettingsOpen, setIsQueueSettingsOpen] = useState(false)
	const [autoFillTargetInput, setAutoFillTargetInput] = useState(5)
	const [isEmptying, setIsEmptying] = useState(false)
	const reloadIdRef = useRef(0)

	// Lap time editing
	const [pastLaps, setPastLaps] = useState([])
	const [isHistoryOpen, setIsHistoryOpen] = useState(false);
	const [editingLapId, setEditingLapId] = useState(null)
	const [editHours, setEditHours] = useState(0)
	const [editMinutes, setEditMinutes] = useState(0)
	const [editSeconds, setEditSeconds] = useState(0)

	useLockBodyScroll(isQueueOpen || isAddLapOpen)

	const { teamId, isLoadingTeam } = useTeam()

////////////////////////////////////////////////////////////
////	        Load needed data of the team		    ////
///////////////////////////////////////////////////////////


	useEffect(function () {
		function handleVisibilityChange() {
			if (document.visibilityState === "visible") {
				reloadEverything()
			}
		}

		document.addEventListener("visibilitychange", handleVisibilityChange)

		return function () {
			document.removeEventListener("visibilitychange", handleVisibilityChange)
		}
	}, [])

	// Load the team's current state once when the page opens
	useEffect(() => {
		if (!teamId) {
			return
		}

		async function loadData() {
			reloadEverything()
		}

			loadData()
	}, [teamId])

	useEffect(function () {
		if (team) {
			setAutoFillTargetInput(team.auto_fill_target)
		}
	}, [team])
	

	// Reload all for realtime updates
	async function reloadEverything() {

		  // Mark this specific call as "the latest one requested"
		reloadIdRef.current = reloadIdRef.current + 1
		const thisReloadId = reloadIdRef.current

		// Team state (queue and overall team)
		const stateResult = await getTeamState(teamId)

		if (stateResult.error) {
			console.error(stateResult.error)
			return
		}
		
		// If a newer reload has started since this one began, throw this
		// result away - it is stale, a more recent call will handle it
		if (thisReloadId !== reloadIdRef.current) {
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

		// Get queue riders
		for (const queueEntry of stateResult.queue) {
			riderIds.push(queueEntry.team_rider.id)
		}

		// Average to calculate wait time in queue
		if (riderIds.length > 0) {
			const averagesResult = await getAverageLapTimesForRiders(riderIds)
			if (!averagesResult.error) {
			setAveragesByRiderId(averagesResult.averages)
			}
		}

		// Active riders (only queue active one)
		const ridersResult = await getActiveRiders(teamId)

		if (!ridersResult.error) {
			setActiveRiders(ridersResult.riders)
		}

		// Previous lap list
		const pastLapsResult = await getPastLaps(teamId)
		if (!pastLapsResult.error) {
			setPastLaps(pastLapsResult.laps)
		}
	}


/////////////////////////////////////////////////////////////
////	     	   Lap history editing				    ////
///////////////////////////////////////////////////////////


	function openEditLap(lap) {
		const hms = secondsToHms(lap.time_seconds)
		setEditHours(hms.hours)
		setEditMinutes(hms.minutes)
		setEditSeconds(hms.seconds)
		setEditingLapId(lap.id)
	}

	async function handleSaveLapEdit() {
		const newTotalSeconds = hmsToSeconds(editHours, editMinutes, editSeconds)
		await updateLapTime(editingLapId, newTotalSeconds)
		setEditingLapId(null)
		reloadEverything()
	}

////////////////////////////////////////////////////////////
////	     	   Update every second				    ////
///////////////////////////////////////////////////////////


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


	useEffect(function () {

		if (!teamId) {
			return
		}

		// Create a "channel" - this is just a named subscription
		const channel = supabase
			.channel('team-updates-' + teamId)

			// Listen for any change on the teams table, for this specific team
			.on(
				'postgres_changes',
				{
					event: '*',
					schema: 'public',
					table: 'teams',
					filter: 'id=eq.' + teamId,
				},
				function () {
					reloadEverything()
				}
			)

			// Also listen for any change on the run_queue table, for this team
			.on(
				'postgres_changes',
				{
					event: '*',
					schema: 'public',
					table: 'run_queue',
					filter: 'team_id=eq.' + teamId,
				},
				function () {
					reloadEverything()
				}
			)

			// Listen for any change on the laps table, for this specific team
			.on(
				'postgres_changes',
				{
					event: '*',
					schema: 'public',
					table: 'laps',
					filter: 'id=eq.' + teamId,
				},
				function () {
					reloadEverything()
				}
			)

			// Listen for any change on the team_riders table, for this specific team
			.on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'team_riders',
                    filter: 'team_id=eq.' + teamId,
                },
                async function () {
					await updateQueueByStatus(teamId)
                    reloadEverything()
                }
            )

			// Actually start listening
			.subscribe()

		// Cleanup - stop listening when the page is closed/left
		return function () {
			supabase.removeChannel(channel)
		}
	}, [teamId])

	if (isChecking) return null

	if (isLoadingTeam) {
  		return <p className="text-center mt-10 text-gray-500">{t("main_loading")}</p>
	}

	if (!teamId) {
		window.location.replace("/team-setup")
  		return <p className="text-center mt-10 text-gray-500">{t("main_loading")}</p>
	}

	if (!team) {
		return <p className="text-center mt-10 text-gray-500">{t("main_loading")}</p>
	}


////////////////////////////////////////////////////////////
////	      		  Tools formatting			 	   ////
///////////////////////////////////////////////////////////


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


	// Helper: formats a Date object into the exact string format
	// the datetime input field expects (YYYY-MM-DDTHH:MM:SS)
	function formatForDateTimeInput(date) {
		const pad = function (number) {
			return String(number).padStart(2, "0")
		}

		const year = date.getFullYear()
		const month = pad(date.getMonth() + 1)
		const day = pad(date.getDate())
		const hours = pad(date.getHours())
		const minutes = pad(date.getMinutes())
		const seconds = pad(date.getSeconds())

		return year + "-" + month + "-" + day + "T" + hours + ":" + minutes + ":" + seconds
		}

	// Helper : Format pace from seconds and a lap amount
	function formatPace(timeSeconds, lapCount) {
		const paceSeconds = timeSeconds / lapCount
		return formatSeconds(paceSeconds)
	}

	// A small helper: returns "tour" or "tours" depending on the count
	// (traduit aussi, comme ça pas besoin d'y penser à chaque appel)
	function pluralizeTour(count) {
		if (count === 1) {
			return t("main_tour_singular")
		} else {
			return t("main_tour_plural")
		}
	}
	// Breaks a total number of seconds into separate hours, minutes, seconds
	function secondsToHms(totalSeconds) {
		const safeSeconds = Math.max(0, Math.round(totalSeconds))
		const hours = Math.floor(safeSeconds / 3600)
		const minutes = Math.floor((safeSeconds % 3600) / 60)
		const seconds = safeSeconds % 60

		return { hours: hours, minutes: minutes, seconds: seconds }
	}

	// Combines separate hours, minutes, seconds back into one total
	function hmsToSeconds(hours, minutes, seconds) {
		return (hours * 3600) + (minutes * 60) + seconds
	}


////////////////////////////////////////////////////////////
////	     	  	 Time calculations				    ////
///////////////////////////////////////////////////////////


	// Figure out how much time is left on the CURRENT leg
	let remainingOnCurrentLeg = 0
	let isOverdue = false

	if (team.current_rider) {
		const currentAverage = averagesByRiderId[team.current_rider.id]

		if (currentAverage) {
			const predictedTotalSeconds = currentAverage * team.current_leg_lap_count
			remainingOnCurrentLeg = predictedTotalSeconds - elapsedSeconds

			if (remainingOnCurrentLeg <= 0) {
				isOverdue = true
			}
		}
	}
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

	queueWithEtas.push({
		id: queueEntry.id,
		riderId: queueEntry.team_rider.id,
		riderName: queueEntry.team_rider.name,
		riderAvatarUrl: queueEntry.team_rider.profile?.avatar_url,
		lapCount: queueEntry.lap_count,
		etaSeconds: etaForThisEntry,
	})

		const riderAverage = averagesByRiderId[queueEntry.team_rider.id]

		if (riderAverage) {
			cumulativeSeconds = cumulativeSeconds + riderAverage * queueEntry.lap_count
		}
	}

	const nextEntry = queueWithEtas.length > 0 ? queueWithEtas[0] : null


/////////////////////////////////////////////////////////////
////	    	 	  Add Lap Popup					    ////
///////////////////////////////////////////////////////////


	// Opens the popup with sensible defaults already filled in
	function openAddLapPopup() {
		if (team.current_rider) {
			setSelectedRiderId(team.current_rider.id)
			setLapCount(team.current_leg_lap_count)
		} else {
			setLapCount(1)
		}

		const oneMinuteAgo = new Date()
		oneMinuteAgo.setMinutes(oneMinuteAgo.getMinutes() - 1)
		setFinishTime(formatForDateTimeInput(oneMinuteAgo))

		setIsAddLapOpen(true)
	}

	async function handleSubmitLap(e) {
		e.preventDefault()

		const finishTimeIso = new Date(finishTime).toISOString()

		const result = await logLapAndAdvance(team.id, selectedRiderId, lapCount, finishTimeIso)

		if (result.error) {
			console.error(result.error)
			return
		}

		setIsAddLapOpen(false)

		// Reload the page's data so the new current runner and queue show up
		reloadEverything()
	}


/////////////////////////////////////////////////////////////
////	         Draggable queue element			    ////
///////////////////////////////////////////////////////////


	async function handleDragEnd(event) {
		const draggedItemId = event.active.id
		const droppedOnItemId = event.over ? event.over.id : null

		// If the item was dropped outside the list, or back where it started, do nothing
		if (!droppedOnItemId || draggedItemId === droppedOnItemId) {
			return
		}

		// Find the current positions of the dragged item and the drop target
		const oldIndex = queueWithEtas.findIndex(function (entry) {
			return entry.id === draggedItemId
		})

		const newIndex = queueWithEtas.findIndex(function (entry) {
			return entry.id === droppedOnItemId
		})

		// Build the new order: a copy of the array, with the dragged item moved
		const reordered = queueWithEtas.slice()
		const movedItem = reordered.splice(oldIndex, 1)[0]
		reordered.splice(newIndex, 0, movedItem)

		// Update what's shown on screen immediately, so it feels instant
		setQueue(reordered.map(function (entry) {
			return {
				id: entry.id,
				team_rider: { id: entry.riderId, name: entry.riderName },
				lap_count: entry.lapCount,
			}
		}))

		// Then save the new order to the database in the background
		const orderedIds = reordered.map(function (entry) {
			return entry.id
		})

		await reorderQueue(orderedIds)
	}


/////////////////////////////////////////////////////////////
////	    	   	Queue Entries Editing				////
///////////////////////////////////////////////////////////


	async function handleDeleteQueueEntry(queueEntryId) {
		await removeFromQueue(queueEntryId)
		reloadEverything()
	}

	async function handleChangeQueueLapCount(queueEntryId, newLapCount) {
		await updateQueueEntryLapCount(queueEntryId, newLapCount)
		reloadEverything()
	}

	async function handleAddRiderToQueue() {
		if (!riderToAdd) {
			return
		}

		await addToQueue(team.id, riderToAdd, lapCountToAdd)

		setRiderToAdd("")
		setLapCountToAdd(1)
		setIsAddingToQueue(false)

		reloadEverything()
	}


	
	// Edit current runner id or lap count
	function openEditCurrentRider() {
		if (team.current_rider) {
			setEditedRiderId(team.current_rider.id)
		}

		setEditedLapCount(team.current_leg_lap_count)
		setIsEditingCurrentRider(true)
	}


	async function handleSaveCurrentRiderEdit() {
		await updateCurrentRider(team.id, editedRiderId)
		await updateCurrentLegLapCount(team.id, editedLapCount)

		setIsEditingCurrentRider(false)
		reloadEverything()
	}

	async function handleToggleAutoFill() {
		const newValue = !team.auto_fill
		await setAutoFill(team.id, newValue)

		if (newValue) {
			replenishQueueIfNeeded(team.id)
		}
		
		reloadEverything()
	}

	async function handleAutoFillClick() {
		if (isReplenishing) {
			return
		}

		setIsReplenishing(true)

		try {
			await replenishQueueIfNeeded(team.id)
		} finally {
			setIsReplenishing(false)
		}

		reloadEverything()
		
	}

	async function handleEmptyQueue() {

		setIsEmptying(true)

		try {
			await emptyQueue(team.id)
		} finally {
			setIsEmptying(false)
		}

		reloadEverything()
	}

	async function handleSaveAutoFillTarget() {
		await setAutoFillTarget(team.id, Number(autoFillTargetInput))
		reloadEverything()
	}

/////////////////////////////////////////////////////////////
////	     		   Page Content					    ////
///////////////////////////////////////////////////////////


	return (
        <div className="min-h-screen p-5 pb-28 relative overflow-x-hidden">
        <div className="fixed inset-0 bg-gray-100 dark:bg-gray-950 z-[-2]"/>

{/* Logo watermark */}
        <div className="flex justify-center">
            <div className="fixed inset-0 flex items-center justify-center pointer-events-none z-[-1]">
                    <img 
                        src="/ctt-logo.png"
                        className="w-auto h-60 object-contain opacity-2 dark:opacity-2" 
                        alt="back-logo"
                    />
            </div>
        </div>

		<div className="max-w-sm mx-auto">

{/* Logo and team name */}
			<div className="flex justify-center mb-9">
				<div className="relative w-80 h-24 flex items-center justify-center">
						<div className="bg-white/80 dark:bg-gray-900/80 rounded-2xl border border-gray-200 dark:border-gray-800 px-5 py-4">
							<h1 className="relative text-center text-xl font-medium">{team.name}</h1>
						</div>
						<img 
							src="https://static.wixstatic.com/media/ca73d0_c6b9929de46744dd843625f3b2f98196~mv2.png/v1/fill/w_212,h_84,al_c,q_85,usm_0.66_1.00_0.01,enc_avif,quality_auto/Ruban%20BD.png"
							className="absolute left-1/2 -translate-x-4 z-0 max-h-full object-contain opacity-80 z-[-1]" 
							alt="Background Ribbon"
						/>
				</div>
			</div>
{/* Start event onboarding */}
			{isStartEventOpen ? (
				<div
					className="fixed inset-0 bg-black/40 flex items-center justify-center p-5"
					onClick={function () { setIsStartEventOpen(false) }}
				>
					<div
						className="bg-white dark:bg-gray-900 rounded-2xl p-5 w-full max-w-sm"
						onClick={function (e) { e.stopPropagation() }}
					>
						<div className="flex items-center justify-between mb-4">
							<p className="font-medium text-lg">{t("main_start_event")}</p>
							<button onClick={function () { setIsStartEventOpen(false) }} className="text-gray-400 text-xl px-1">✕</button>
						</div>

						<div className="flex flex-col gap-3">
							<div>
								<label className="text-sm text-gray-500 dark:text-gray-400">{t("main_first_rider_label")}</label>
								<select
									value={startRiderId}
									onChange={function (e) { setStartRiderId(e.target.value) }}
									className="w-full border border-gray-200 dark:border-gray-700 rounded-lg p-2 mt-1"
								>
									<option value="">{t("main_choose_rider")}</option>
									{activeRiders.map(function (rider) {
										return (
											<option key={rider.id} value={rider.id}>{rider.name}</option>
									)
									})}
								</select>
							</div>

							<div>
								<label className="text-sm text-gray-500 dark:text-gray-400">{t("main_lap_count_label")}</label>
								<input
									type="text"
									inputMode="numeric"
									pattern="[0-9]*"
									min="1"
									value={startLapCount}
									onChange={function (e) { setStartLapCount(Number(e.target.value)) }}
									className="w-full border border-gray-200 dark:border-gray-700 rounded-lg p-2 mt-1"
								/>
							</div>

							<div className="flex gap-2 mt-2">
								<button
									onClick={function () { setIsStartEventOpen(false) }}
									className="flex-1 border border-gray-200 dark:border-gray-700 rounded-xl py-2 text-sm"
								>
									{t("main_cancel")}
								</button>
								<button
									onClick={async function () {
									if (!startRiderId) return
										await startEvent(team.id, startRiderId, startLapCount)
										setIsStartEventOpen(false)
										reloadEverything()
									}}
									disabled={!startRiderId}
									className="flex-1 bg-blue-600 text-white rounded-xl py-2 text-sm font-medium disabled:opacity-40"
								>
									{t("main_start_event_confirm")}
								</button>
							</div>
						</div>
					</div>
				</div>
				) : null}

{/* Current running rider */}
			{team.event_started ? (
				<div className={team.event_started && !team.current_rider 
					? "bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 p-5" 
					: "bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 p-5 mb-8"}>

					<p className="text-sm text-gray-500 dark:text-gray-400 mb-3">{t("main_currently_running")}</p>

{/* Current runner editor */}
					{isEditingCurrentRider ? (
					<div className="border border-gray-200 dark:border-gray-700 rounded-xl p-3 flex flex-col gap-2 mb-4">

						<select
							value={editedRiderId}
							onChange={function (e) { setEditedRiderId(e.target.value) }}
							className="w-full border border-gray-200 dark:border-gray-700 rounded-lg p-2 text-sm">

							{activeRiders.map(function (rider) {
								return (
									<option key={rider.id} value={rider.id}>
										{rider.name}
									</option>
								)
							})}
						</select>

						<input
							type="text"
							inputMode="numeric"
							pattern="[0-9]*"
							min="1"
							value={editedLapCount}
							onChange={function (e) { setEditedLapCount(Number(e.target.value)) }}
							className="w-full border border-gray-200 dark:border-gray-700 rounded-lg p-2 text-sm"/>

						<div className="flex gap-2">
							<button
								onClick={function () { setIsEditingCurrentRider(false) }}
								className="flex-1 border border-gray-200 dark:border-gray-700 rounded-lg py-2 text-sm">

								{t("main_cancel")}

							</button>
							<button
								onClick={handleSaveCurrentRiderEdit}
								className="flex-1 bg-blue-600 text-white rounded-lg py-2 text-sm">

								{t("main_confirm")}

							</button>
						</div>

					</div>
					) : (
					<div className="flex items-center gap-3 mb-4">
						{team.current_rider ? (
						<>
							<div className="w-[52px] h-[52px] rounded-full bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 flex items-center justify-center font-medium text-base flex-shrink-0 overflow-hidden">
								{team.current_rider.profile?.avatar_url ? (
									<img src={team.current_rider.profile.avatar_url} alt="" className="w-full h-full object-cover" />
								) : (
									getInitials(team.current_rider.name)
								)}
							</div>
							<div className="flex-1">
								<p className="font-medium text-lg">{team.current_rider.name}</p>
								<p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
									{team.current_leg_lap_count} {pluralizeTour(team.current_leg_lap_count)} {team.current_leg_lap_count === 1 ? t("main_planned_singular") : t("main_planned_plural")}
								</p>
							</div>
							<button
								onClick={openEditCurrentRider}
								aria-label={t("main_edit_current_rider")}
								className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 px-1">

							✎

							</button>
						</>
						) : (
						<div className="flex flex-col items-center gap-3 py-2">
							<p className="text-gray-500 dark:text-gray-400">{t("main_nobody_running")}</p>
							<p className="text-xs text-gray-400 dark:text-gray-500">{t("main_fill_queue_to_continue")}</p>
						</div>
						)}
							


					</div>
					)}
{/* Elapsed time of current rider */}
					{team.current_rider ? (
						<div className="flex items-center gap-2 border-t border-gray-200 dark:border-gray-700 pt-3">
							<span className="text-sm text-gray-500 dark:text-gray-400">{t("main_elapsed_time")}</span>
							<span className="text-xl font-medium ml-auto">{formatSeconds(elapsedSeconds)}</span>
						</div>
					) : null}
				</div>
			
			):(
				// Pre-event: big start button
				<button
					onClick={function () { setIsStartEventOpen(true) }}
					className="w-full bg-blue-600 text-white rounded-2xl py-6 font-medium text-lg mb-8"
				>
{/* Event start button */}						
					{t("main_start_event")}
				</button>
			)}
{/* Empty queue restart */}				
			{team.event_started && !team.current_rider ? ( // We need at least one rider in queue to start a relay
				<button
					onClick={async () => {
						const { error } = await startNextRiderInQueue(teamId);

						if (error) {
							console.error(error);
						}
						reloadEverything()
					}}
					className="w-full bg-blue-600 text-white rounded-xl py-3 font-medium text-sm my-5"
				>
					{t("main_start_relay")}
				</button>				
			) : null}


				<div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 px-5 py-4 mb-8">
{/* Next rider in line*/}
					{nextEntry ? (
						<div className="flex items-center gap-3">
							<div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-300 flex items-center justify-center font-medium text-sm flex-shrink-0 overflow-hidden">
								{nextEntry.riderAvatarUrl ? (
									<img src={nextEntry.riderAvatarUrl} alt="" className="w-full h-full object-cover" />
								) : (
									getInitials(nextEntry.riderName)
								)}
							</div>
							<div className="flex-1">
								<p className="text-sm text-gray-500 dark:text-gray-400">
									{team.event_started ? t("main_next_up") : t("main_first_relay")}
								</p>
								<p className="font-medium text-sm mt-0.5">{nextEntry.riderName}</p>
							</div>
							{team.event_started ? (
								<div className="text-right">
									<p className="text-sm text-gray-500 dark:text-gray-400">{t("main_in")}</p>
{/* Relay blinking text */}
									{isOverdue ? (
										<span className="blink-orange text-red-600 dark:text-orange-400 text-xl font-medium ml-auto">
											{t("main_relay")}
										</span>
									) : (
										<p className="font-medium text-sm mt-0.5">~ {formatSeconds(nextEntry.etaSeconds)}</p>
								)}
								</div>
							) : null}
						</div>
					) : (
						<p className="text-gray-500 dark:text-gray-400">{t("main_queue_empty")}</p>
					)}
				</div>
{/* Queue popup window */}
				<button
					onClick={function () { setIsQueueOpen(true) }}
					className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 dark:border-gray-800 rounded-xl py-3 font-medium text-sm hover:bg-gray-50">
					{t("main_see_queue")}
				</button>

				{isQueueOpen ? (
					<div
						className="fixed inset-0 bg-black/40 flex items-center justify-center p-5"
						onClick={function () { setIsQueueOpen(false) }}>
						
							<div
								className="bg-white dark:bg-gray-900 rounded-2xl p-5 w-full max-w-sm max-h-[80vh] overflow-y-auto"
								onClick={function (e) { e.stopPropagation() }}>

								<div className="flex items-center justify-between mb-4">
									<p className="font-medium text-lg">{t("main_queue_title")}</p>
									<button
										onClick={function () { setIsQueueOpen(false) }}
										aria-label={t("main_close")}
										className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-xl px-1"
									>

										✕

									</button>
									
							</div>
{/* Draggable element space */}
							<DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
								<SortableContext
									items={queueWithEtas.map(function (entry) { return entry.id })}
									strategy={verticalListSortingStrategy}
								>
									<div className="flex flex-col gap-2">
									{queueWithEtas.map(function (entry) {
										return (
											<QueueItem
												key={entry.id}
												entry={{
													id: entry.id,
													riderName: entry.riderName,
													riderAvatarUrl: entry.riderAvatarUrl,
													lapCount: entry.lapCount,
													etaText: formatSeconds(entry.etaSeconds),
												}}
												onDelete={handleDeleteQueueEntry}
												onChangeLapCount={handleChangeQueueLapCount}
											/>
										)
									})}
									</div>
								</SortableContext>
							</DndContext>

{/* Queue filling options */}					

							<div className="flex items-center gap-2 mb-3 mt-5 px-1 py-3 border-y border-gray-200 dark:border-gray-800">
								<button
									onClick={handleAutoFillClick}
									disabled={isReplenishing}
									className="flex-1 border border-gray-200 dark:border-gray-700 rounded-xl py-2 text-sm font-medium bg-white dark:bg-gray-900 active:scale-[0.98] transition-transform disabled:opacity-50"
								>
									{isReplenishing ? t("main_filling") : t("main_fill_queue")}
								</button>
								<button
									onClick={handleEmptyQueue}
									disabled={isEmptying}
									className="flex-1 border border-gray-200 dark:border-gray-700 rounded-xl py-2 text-sm font-medium bg-white dark:bg-gray-900 active:scale-[0.98] transition-transform disabled:opacity-50"
								>
									{isEmptying ? t("main_emptying") : t("main_empty_queue")}
								</button>

								<button
									onClick={function () { setIsQueueSettingsOpen(true) }}
									aria-label={t("main_fill_settings")}
									className="w-9 h-9 flex-shrink-0 flex items-center justify-center border border-gray-200 dark:border-gray-700 rounded-xl text-gray-500 dark:text-gray-400"
								>
									<SlidersHorizontal className="m-2"></SlidersHorizontal>
								</button>
							</div>
{/* Queue filling options menu */}							
							{isQueueSettingsOpen ? (
								<div
									className="fixed inset-0 bg-black/40 flex items-center justify-center p-5"
									onClick={function () { setIsQueueSettingsOpen(false) }}
								>
									<div
										className="bg-white dark:bg-gray-900 rounded-2xl p-5 w-full max-w-sm"
										onClick={function (e) { e.stopPropagation() }}
									>
									<div className="flex items-center justify-between mb-4">
										<p className="font-medium text-lg">{t("main_fill_settings_title")}</p>
										<button
											onClick={function () { setIsQueueSettingsOpen(false) }}
											aria-label={t("main_close")}
											className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-xl px-1"
										>

										✕

										</button>
									</div>

									<div className="flex items-center justify-between mb-4">
										<p className="text-sm text-gray-500 dark:text-gray-400">{t("main_auto_fill")}</p>
										<button
											onClick={handleToggleAutoFill}
											className={
												team.auto_fill
												? "w-11 h-6 rounded-full bg-blue-600 flex items-center px-1 justify-end transition-colors duration-200"
												: "w-11 h-6 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center px-1 justify-start transition-colors duration-200"
											}
										>
										<div className="w-4 h-4 rounded-full bg-white shadow-sm"></div>
										</button>
									</div>

									<div className="flex items-center justify-between">
										<p className="text-sm text-gray-500 dark:text-gray-400">{t("main_min_queue_size")}</p>
										<div className="flex items-center gap-2">
										<input
											type="text"
											inputMode="numeric"
											pattern="[0-9]*"
											min="1"
											value={autoFillTargetInput}
											onChange={function (e) { setAutoFillTargetInput(e.target.value) }}
											onBlur={handleSaveAutoFillTarget}
											className="w-16 text-center border border-gray-200 dark:border-gray-700 rounded-lg p-1 text-sm bg-white dark:bg-gray-900"
										/>
										</div>
									</div>
									</div>
								</div>
								) : null}

{/* Add rider popup window */}	
							<div className="mt-5 mb-4">
								{isAddingToQueue ? (
									<div className="border border-gray-200 dark:border-gray-700 rounded-xl p-3 flex flex-col gap-2">

										<select
											value={riderToAdd}
											onChange={function (e) { setRiderToAdd(e.target.value) }}
											className="w-full border border-gray-200 dark:border-gray-700 rounded-lg p-2 text-sm"
										>
											<option value="">{t("main_choose_rider")}</option>
											{activeRiders.map(function (rider) {
												return (
													<option key={rider.id} value={rider.id}>
														{rider.name}
													</option>
											)
											})}
										</select>

										<input
											type="text"
											inputMode="numeric"
											pattern="[0-9]*"
											min="1"
											value={lapCountToAdd}
											onChange={function (e) { setLapCountToAdd(Number(e.target.value)) }}
											className="w-full border border-gray-200 dark:border-gray-700 rounded-lg p-2 text-sm"
										/>

										<div className="flex gap-2">
											<button
												onClick={function () { setIsAddingToQueue(false) }}
												className="flex-1 border border-gray-200 dark:border-gray-700 rounded-lg py-2 text-sm"
											>

											{t("main_cancel")}

											</button>
											<button
												onClick={handleAddRiderToQueue}
												className="flex-1 bg-blue-600 text-white rounded-lg py-2 text-sm"
											>
											
											{t("main_add")}

											</button>
										</div>

									</div>
								) : (
									<button
										onClick={function () { setIsAddingToQueue(true) }}
										aria-label={t("main_add_rider")}
										className="w-full border border-gray-200 dark:border-gray-700 rounded-xl py-2 text-sm text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800">

									{t("main_add_rider_plus")}

									</button>
								)}
							</div>
					</div>
				</div>
				) : null}

				<button
					onClick={openAddLapPopup}
					disabled={!team.event_started}
					className={team.event_started
						? "w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl py-3 font-medium text-sm hover:bg-gray-50 dark:hover:bg-gray-700 mt-2 "
						: "w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl py-3 font-medium text-sm hover:bg-gray-50 dark:hover:bg-gray-700 mt-2 disabled:opacity-40 disabled:cursor-not-allowed relative z-[-1]"}>
					
					{t("main_add_relay")}

				</button>
{/* Add laps of a given rider popup window*/}
				{isAddLapOpen ? (
				<div 
					className="fixed inset-0 bg-black/40 flex items-center justify-center p-5"
					onClick={function () { setIsAddLapOpen(false) }}>

					<div 
						className="bg-white dark:bg-gray-900 rounded-2xl p-5 w-full max-w-sm max-h-[80vh] overflow-y-auto"
						onClick={function (e) { e.stopPropagation() }}>
						
						<div className="flex items-center justify-between mb-4">
							<p className="font-medium text-lg mb-4">{t("main_add_time")}</p>
							<button
								onClick={function () { setIsAddLapOpen(false) }}
								aria-label={t("main_close")}
								className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-xl px-1"
							>
							✕
							</button>
						</div>

						<form onSubmit={handleSubmitLap} className="flex flex-col gap-3">

							<div>
								<label className="text-sm text-gray-500 dark:text-gray-400">{t("main_rider_label")}</label>
								<select
									value={selectedRiderId}
									onChange={function (e) { setSelectedRiderId(e.target.value) }}
									className="w-full border border-gray-200 dark:border-gray-700 rounded-lg p-2">
									{activeRiders.map(function (rider) {
										return (
											<option key={rider.id} value={rider.id}>
												{rider.name}
											</option>
										)}
									)}
								</select>
							</div>

							<div>
								<label className="text-sm text-gray-500 dark:text-gray-400">{t("main_lap_count_label")}</label>
								<input
									type="text"
									inputMode="numeric"
									pattern="[0-9]*"
									min="1"
									value={lapCount}
									onChange={function (e) { setLapCount(Number(e.target.value)) }}
									className="w-full border border-gray-200 dark:border-gray-700 rounded-lg p-2"/>
							</div>

							<div>
								<label className="text-sm text-gray-500 dark:text-gray-400">{t("main_finish_time_label")}</label>
								<input
									type="datetime-local"
									step="1"
									value={finishTime}
									onChange={function (e) { setFinishTime(e.target.value) }}
									className="w-full border border-gray-200 dark:border-gray-700 rounded-lg p-2"/>
							</div>

							<div className="flex gap-2 mt-2">
								<button
									type="button"
									onClick={function () { setIsAddLapOpen(false) }}
									className="flex-1 border border-gray-200 dark:border-gray-700 rounded-xl py-2">
									{t("main_cancel")}
								</button>
								<button
									type="submit"
									className="flex-1 bg-blue-600 text-white rounded-xl py-2">
									{t("main_confirm")}
								</button>
							</div>
						</form>
					</div>
				</div>
				) : null}
{/* Team laps history acordeon*/}
				<div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 mt-4">

					<button
						onClick={function () { setIsHistoryOpen(!isHistoryOpen) }}
						className="w-full flex items-center justify-between px-4 py-4 text-left font-medium text-sm text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">

						<span>{t("main_history")}</span>
						<span className={`text-xs transform transition-transform duration-200 ${isHistoryOpen ? 'rotate-180' : ''}`}>
							▼
						</span>
					</button>
					<div 
						className={`transition-all duration-300 ease-in-out flex flex-col overflow-y-auto ${
							isHistoryOpen ? 'max-h-[350px] opacity-100 border-t border-gray-100 dark:border-gray-800' : 'max-h-0 opacity-0'
						}`}
					>
					{pastLaps.length === 0 ? (
								<p className="text-gray-400 dark:text-gray-500 text-sm text-center py-6">
									{t("main_no_laps_yet")}
								</p>
						) : (
							pastLaps.map(function (lap) {
								return (
									<div
										key={lap.id}
										className="flex items-center gap-3 px-4 py-3 border-b last:border-b-0 border-gray-100 dark:border-gray-800"
									>
										<div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-300 flex items-center justify-center font-medium text-sm flex-shrink-0 overflow-hidden">
											{lap.team_rider.profile?.avatar_url ? (
												<img src={lap.team_rider.profile.avatar_url} alt="" className="w-full h-full object-cover" />
											) : (
												getInitials(lap.team_rider.name)
											)}
										</div>

										{editingLapId !== lap.id ? (
										<>
											<p className="font-medium text-sm flex-1">{lap.team_rider.name}</p>

											<div className="text-center px-3 border-l border-r border-gray-100 dark:border-gray-800">
												<p className="text-base font-medium">{lap.lap_count}</p>
												<p className="text-[10px] text-gray-500 dark:text-gray-400">{pluralizeTour(lap.lap_count)}</p>
											</div>
										</>
										) : null}
										{editingLapId === lap.id ? (
											<div className="flex items-center gap-1 pl-1">
												<input
													type="text"
													inputMode="numeric"
													pattern="[0-9]*"
													value={editHours}
													onChange={function (e) { setEditHours(Number(e.target.value) || 0) }}
													className="w-8 text-center border border-gray-200 dark:border-gray-700 rounded p-1 text-xs"
												/>
												<span className="text-xs text-gray-400">h</span>
												<input
													type="text"
													inputMode="numeric"
													pattern="[0-9]*"
													value={editMinutes}
													onChange={function (e) { setEditMinutes(Number(e.target.value) || 0) }}
													className="w-8 text-center border border-gray-200 dark:border-gray-700 rounded p-1 text-xs"
												/>
												<span className="text-xs text-gray-400">m</span>
												<input
													type="text"
													inputMode="numeric"
													pattern="[0-9]*"
													value={editSeconds}
													onChange={function (e) { setEditSeconds(Number(e.target.value) || 0) }}
													className="w-8 text-center border border-gray-200 dark:border-gray-700 rounded p-1 text-xs"
												/>
												<span className="text-xs text-gray-400">s</span>

												<button
													onClick={handleSaveLapEdit}
													aria-label={t("main_confirm")}
													className="text-green-600 px-1 text-sm"
												>

													<Check></Check>

												</button>
												<button
													onClick={function () { setEditingLapId(null) }}
													aria-label={t("main_cancel")}
													className="text-gray-400 px-1 text-sm"
												>

													<X></X>

												</button>
											</div>
										) : (
											<button
												onClick={function () { openEditLap(lap) }}
												className="text-right pl-1"
											>
												<p className="text-sm font-medium">{formatSeconds(lap.time_seconds)}</p>
												<p className="text-xs text-gray-500 dark:text-gray-400">
													{formatPace(lap.time_seconds, lap.lap_count)} {t("main_per_lap")}
												</p>
											</button>
										)}
									</div>
							)})
						)
					}
					</div>
				</div>
{/* Onboarding */}				
				{shouldShow ? (
					<OnboardingPopup
						message={t("onboarding_main")}
						onDismiss={dismiss}
					/>
				) : null}
			</div>
		</div>
	)
}