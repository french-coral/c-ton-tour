import { supabase } from './supabase'
import { CIRCUIT_LENGTH_KM, CIRCUIT_ELEVATION_METERS } from './constants'

// Get everything needed to render the Main page for a team
export async function getTeamState(teamId) {
    const { data: team, error: teamError } = await supabase
        .from('teams')
        .select('*, current_rider:current_rider_id(id, name, profile:profile_id(avatar_url))')
        .eq('id', teamId)
        .single()

    if (teamError) return { error: teamError }

    const { data: queue, error: queueError } = await supabase
        .from('run_queue')
        .select('*, team_rider:team_rider_id(id, name, profile:profile_id(avatar_url))')
        .eq('team_id', teamId)
        .order('position', { ascending: true })

    if (queueError) return { error: queueError }

    return { team, queue }
}

// Average lap time for a given rider, used to predict how long their leg takes
export async function getRiderAverageLapTime(teamRiderId) {
    const { data, error } = await supabase
        .from('laps')
        .select('time_seconds, lap_count')
        .eq('team_rider_id', teamRiderId)

    if (error || !data || data.length === 0) return { average: null, error }

    const totalTime = data.reduce((sum, lap) => sum + lap.time_seconds, 0)
    const totalLaps = data.reduce((sum, lap) => sum + lap.lap_count, 0)

    return { average: totalTime / totalLaps, error: null }
}


export async function updateQueueByStatus(teamId) {
    // Get the queue of the team
    const currentQueue = await supabase
        .from('run_queue')
        .select('*')
        .eq('team_id', teamId)

    if (currentQueue.error) {
        return { error: currentQueue.error }
    }

    const queue = currentQueue.data

    if (!queue) {
        return { error: { message: 'Queue is empty' } }
    }

    // Get acive riders
    const ridersResult = await supabase
        .from('team_riders')
        .select('id')
        .eq('team_id', teamId)
        .eq('status', 'active')

    if (ridersResult.error) {
        return { error: ridersResult.error }
        
    }

    if (!ridersResult.data) {
        return { error: "No active rider data"}
    }

    const ridersIdInQueue = []
    const activeRidersIds = []

    // Get riders ids in queue
    for (const entry of queue) {
        ridersIdInQueue.push(entry.team_rider_id)
    }

    // Get active riders ids
    for (const rider of ridersResult.data) {
        activeRidersIds.push(rider.id)
    }

    const queueEntryIdsToDelete = []
    // Gather ones to delete
    for (const entry of queue) {
        if (!activeRidersIds.includes(entry.team_rider_id)) {
            queueEntryIdsToDelete.push(entry.id)
        }
    }

    // Remove all inactive or resting riders
    for (const queueEntryId of queueEntryIdsToDelete) {
        // Remove that entry from the queue
        const deleteResult = await supabase
            .from('run_queue')
            .delete()
            .eq('id', queueEntryId)

        if (deleteResult.error) {
            return { error: deleteResult.error }
        }
    }

    // Check if this team has Auto Fill turned on
    const teamSettingsResult = await supabase
        .from('teams')
        .select('auto_fill')
        .eq('id', teamId)
        .single()

    if (teamSettingsResult.error) {
        return { error: teamSettingsResult.error }
    }

    const autoFillIsOn = teamSettingsResult.data.auto_fill

    // Only top up the queue if Auto Fill is enabled
    if (autoFillIsOn) {
        console.log("Coucou ya autofill");
        
        await replenishQueueIfNeeded(teamId)
    }

    return { error: null }
}

// Manual override: change WHO is running, without touching the start time
export async function overrideCurrentRider(teamId, newRiderId) {
    const { error } = await supabase
        .from('teams')
        .update({ current_rider_id: newRiderId })
        .eq('id', teamId)

    return { error }
}

// Add a rider to the end of the queue
export async function addToQueue(teamId, teamRiderId, lapCount = 1) {
    const { data: existing } = await supabase
        .from('run_queue')
        .select('position')
        .eq('team_id', teamId)
        .order('position', { ascending: false })
        .limit(1)
        .maybeSingle()

    const nextPosition = existing ? existing.position + 1 : 1

    const { error } = await supabase
        .from('run_queue')
        .insert({ team_id: teamId, team_rider_id: teamRiderId, lap_count: lapCount, position: nextPosition })

    return { error }
}

// Rewrite positions after a drag-and-drop reorder
// orderedIds = array of run_queue row ids, in their new order
export async function reorderQueue(orderedIds) {
    const updates = orderedIds.map((id, index) =>
        supabase
            .from('run_queue')
            .update({ position: index + 1 })
            .eq('id', id)
    )
    const results = await Promise.all(updates)
    const error = results.find((r) => r.error)?.error ?? null
    return { error }
}


export async function replenishQueueIfNeeded(teamId) {

    // Set desired queue length
    const teamSettingsResult = await supabase
        .from('teams')
        .select('auto_fill_target')
        .eq('id', teamId)
        .single()

    if (teamSettingsResult.error) {
        return { error: teamSettingsResult.error }
    }

    const targetLength = teamSettingsResult.data.auto_fill_target

    // How many real entries are currently in the queue?
    const currentQueueResult = await supabase
        .from('run_queue')
        .select('id, team_rider_id, position')
        .eq('team_id', teamId)
        .order('position', { ascending: false })

    if (currentQueueResult.error) {
        return { error: currentQueueResult.error }
    }

    const currentLength = currentQueueResult.data.length
    const existingQueue = currentQueueResult.data

    // If we already have enough, there is nothing to do
    if (currentLength >= targetLength) {
        return { error: null }
    }

    // Get the active riders we will cycle through to fill the gap
    const ridersResult = await supabase
        .from('team_riders')
        .select('id')
        .eq('team_id', teamId)
        .eq('status', 'active')

    if (ridersResult.error) {
        return { error: ridersResult.error }
    }

    const activeRiders = ridersResult.data

    if (activeRiders.length === 0) {
        // No active riders exist, nothing we can fill the queue with
        return { error: null }
    }

    const riderIds = activeRiders.map(function (rider) {
        return rider.id
    })

    const lastRanResult = await getLastRanTimes(teamId, riderIds)

    if (lastRanResult.error) {
        return { error: lastRanResult.error }
    }

    const lastRanTimes = lastRanResult.lastRanTimes

    // Sort riders so whoever ran longest ago comes first.
    // A rider who never ran (lastRanTimes is null) should come before
    // everyone who has a real timestamp.
    const sortedRiders = riderIds.slice()

    sortedRiders.sort(function (riderIdA, riderIdB) {
        const timeA = lastRanTimes[riderIdA]
        const timeB = lastRanTimes[riderIdB]

        if (!timeA && !timeB) {
            return 0
        }
        if (!timeA) {
            return -1
        }
        if (!timeB) {
            return 1
        }

        if (timeA < timeB) {
            return -1
        }
        if (timeA > timeB) {
            return 1
        }
            return 0
    })

    // The last entry already in the queue 
    // (existingQueue is sorted by position descending, so the first item is the very last one queued)
    let previousRiderId = null
    if (existingQueue.length > 0) {
        previousRiderId = existingQueue[0].team_rider_id
    }

    let nextPosition = 1
    if (existingQueue.length > 0) {
        nextPosition = existingQueue[0].position + 1
    }

    const howManyToAdd = targetLength - currentLength
    const newRows = []

    // This pointer walks through sortedRiders, but can be nudged forward
    // an extra step whenever we would otherwise repeat the previous rider
    let cyclePointer = 0

    for (let i = 0; i < howManyToAdd; i++) {
        let candidateRiderId = sortedRiders[cyclePointer % sortedRiders.length]

        // If this candidate is the same as whoever comes right before it,
        // and there is more than one active rider to choose from instead,
        // skip to the next one in the cycle
        if (candidateRiderId === previousRiderId && sortedRiders.length > 1) {
            cyclePointer = cyclePointer + 1
            candidateRiderId = sortedRiders[cyclePointer % sortedRiders.length]
        }


        newRows.push({
            team_id: teamId,
            team_rider_id: candidateRiderId,
            lap_count: 1,
            position: nextPosition + i,
        })

        previousRiderId = candidateRiderId
        cyclePointer = cyclePointer + 1
        
    }

    const insertResult = await supabase
        .from('run_queue')
        .insert(newRows)

    return { error: insertResult.error }
}



export async function getAverageLapTimesForRiders(riderIds) {
    const lapsResult = await supabase
        .from('laps')
        .select('team_rider_id, time_seconds, lap_count')
        .in('team_rider_id', riderIds)

    if (lapsResult.error) {
        return { averages: null, error: lapsResult.error }
    }

    const allLaps = lapsResult.data

    // We will build a plain object that maps a rider's id to their average
    const averages = {}

    for (const riderId of riderIds) {
        const lapsForThisRider = allLaps.filter(function (lap) {
        return lap.team_rider_id === riderId
        })

        if (lapsForThisRider.length === 0) {
            averages[riderId] = null
            continue
        }

        let totalTime = 0
        let totalLaps = 0

        for (const lap of lapsForThisRider) {
        totalTime = totalTime + lap.time_seconds
        totalLaps = totalLaps + lap.lap_count
        }

        averages[riderId] = totalTime / totalLaps
    }

    return { averages, error: null }
}


export async function logLapAndAdvance(teamId, riderId, lapCount, finishTimeIso) {

    // Get the team's current state, since we need to know
    // when the current leg actually started
    const teamResult = await supabase
        .from('teams')
        .select('current_leg_started_at')
        .eq('id', teamId)
        .single()

    if (teamResult.error) {
        return { error: teamResult.error }
    }

    const legStartedAt = teamResult.data.current_leg_started_at

    // Calculate the real duration of the lap that just finished
    const startTime = new Date(legStartedAt)
    const finishTime = new Date(finishTimeIso)
    const durationInSeconds = Math.round((finishTime - startTime) / 1000)

    // Save this lap with its real, calculated duration
    const insertLapResult = await supabase
        .from('laps')
        .insert({
            team_rider_id: riderId,
            lap_count: lapCount,
            time_seconds: durationInSeconds,
        })

    if (insertLapResult.error) {
        return { error: insertLapResult.error }
    }

    // Find whoever is next in the queue
    const nextInQueueResult = await supabase
        .from('run_queue')
        .select('*')
        .eq('team_id', teamId)
        .order('position', { ascending: true })
        .limit(1)
        .maybeSingle()

    if (nextInQueueResult.error) {
        return { error: nextInQueueResult.error }
    }

    const nextEntry = nextInQueueResult.data

    if (!nextEntry) {
        return { error: { message: 'Queue is empty, cannot advance' } }
    }

    // Promote that next rider, but importantly, set their
    // leg start time to the REAL finish time we were given,
    // not to "predicted" one
    const updateTeamResult = await supabase
        .from('teams')
        .update({
            current_rider_id: nextEntry.team_rider_id,
            current_leg_started_at: finishTimeIso,
            current_leg_lap_count: nextEntry.lap_count,
        })
        .eq('id', teamId)

    if (updateTeamResult.error) {
        return { error: updateTeamResult.error }
    }

    // Remove that entry from the queue, since they are running now
    const deleteResult = await supabase
        .from('run_queue')
        .delete()
        .eq('id', nextEntry.id)

    if (deleteResult.error) {
        return { error: deleteResult.error }
    }

    // Top up the queue automatically, if the team has that setting on
    const teamSettingsResult = await supabase
        .from('teams')
        .select('auto_fill')
        .eq('id', teamId)
        .single()

    if (teamSettingsResult.error) {
        return { error: teamSettingsResult.error }
    }

    if (teamSettingsResult.data.auto_fill) {
        await replenishQueueIfNeeded(teamId)
    }

    return { error: null }
}


// Change WHO is currently running, without touching their start time
export async function updateCurrentRider(teamId, newRiderId) {
  const updateResult = await supabase
    .from('teams')
    .update({ current_rider_id: newRiderId })
    .eq('id', teamId)

  return { error: updateResult.error }
}

// Change how many laps the CURRENT leg is meant to cover
export async function updateCurrentLegLapCount(teamId, newLapCount) {
  const updateResult = await supabase
    .from('teams')
    .update({ current_leg_lap_count: newLapCount })
    .eq('id', teamId)

  return { error: updateResult.error }
}

export async function getActiveRiders(teamId) {
  const ridersResult = await supabase
    .from('team_riders')
    .select('id, name')
    .eq('team_id', teamId)
    .eq('status', 'active')

  return { riders: ridersResult.data, error: ridersResult.error }
}

// Remove one specific entry from the queue
export async function removeFromQueue(queueEntryId) {
  const deleteResult = await supabase
    .from('run_queue')
    .delete()
    .eq('id', queueEntryId)

  return { error: deleteResult.error }
}

// Change how many laps a specific queue entry is planned for
export async function updateQueueEntryLapCount(queueEntryId, newLapCount) {
  const updateResult = await supabase
    .from('run_queue')
    .update({ lap_count: newLapCount })
    .eq('id', queueEntryId)

  return { error: updateResult.error }
}


export async function getPastLaps(teamId, howMany = 400) {

  // We need laps that belong to riders on this specific team.
  // The "!inner" here tells Supabase to actually filter using
  // the joined team_rider's team_id, not just attach it for display
  const lapsResult = await supabase
    .from('laps')
    .select('id, lap_count, time_seconds, created_at, team_rider:team_rider_id!inner(id, name, profile:profile_id(avatar_url), team_id)')
    .eq('team_rider.team_id', teamId)
    .order('created_at', { ascending: false })
    .limit(howMany)

  return { laps: lapsResult.data, error: lapsResult.error }
}

// Get the team's name, used for the page title
export async function getTeamName(teamId) {
  const result = await supabase
    .from('teams')
    .select('name')
    .eq('id', teamId)
    .single()

  return { name: result.data ? result.data.name : null, error: result.error }
}

// Get every rider on a team, for the team list page
export async function getTeamRiders(teamId) {
  const result = await supabase
    .from('team_riders')
    .select('id, name, status, profile:profile_id(avatar_url)')
    .eq('team_id', teamId)
    .order('name', { ascending: true })

  return { riders: result.data, error: result.error }
}

// Get full stats for one specific rider, used in the detail popup
export async function getRiderStats(teamRiderId) {
    const result = await supabase
        .from('laps')
        .select('id, lap_count, time_seconds, created_at')
        .eq('team_rider_id', teamRiderId)
        .order('created_at', { ascending: true })

    if (result.error) {
        return { stats: null, error: result.error }
    }

    const laps = result.data

    if (laps.length === 0) {
        return {
        stats: {
            laps: [],
            averagePace: null,
            totalLaps: 0,
            lastLapTime: null,
            chartData: [],
        },
        error: null,
        }
    }

    let totalTime = 0
    let totalLaps = 0
    const chartData = []

    for (const lap of laps) {
        totalTime = totalTime + lap.time_seconds
        totalLaps = totalLaps + lap.lap_count // if you do 3 laps 30 min, it'll push 3 times a 10 min lap

        const paceForThisLap = lap.time_seconds / lap.lap_count
        const speedForThisLap = CIRCUIT_LENGTH_KM / (paceForThisLap / 3600)

        // This single database row might represent several laps at once
        // (e.g. a 10-lap leg). The chart should show one point PER LAP,
        // not one point per row - so we repeat this same pace value once for every lap it covers.
        for (let i = 0; i < lap.lap_count; i++) {
        chartData.push({
            date: lap.created_at,
            pace: paceForThisLap,
            speed: speedForThisLap,
        })
        }
    }

    const averagePace = totalTime / totalLaps
    const mostRecentLap = laps[laps.length - 1]

    // km/h = distance / time
    // averagePace is seconds per single lap
    // so: km per lap / (seconds per lap / 3600) = km/h
    const averageSpeed = averagePace
        ? (CIRCUIT_LENGTH_KM / (averagePace / 3600))
        : null

    // Total distance covered across all laps
    const totalDistanceKm = totalLaps * CIRCUIT_LENGTH_KM

    // Total elevation gained across all laps
    const totalElevationMeters = totalLaps * CIRCUIT_ELEVATION_METERS
        
    const lapsWithStats = laps.map(function (lap) {
        const paceSeconds = lap.time_seconds / lap.lap_count
        const speedKmh = CIRCUIT_LENGTH_KM / (paceSeconds / 3600)
        return {
            ...lap,
            paceSeconds: paceSeconds,
            speedKmh: speedKmh,
        }
        })

    return {
        stats: {
            laps: lapsWithStats.slice().reverse(),
            averagePace: averagePace,
            averageSpeed: averageSpeed,
            totalLaps: totalLaps,
            totalDistanceKm: totalDistanceKm,
            totalElevationMeters: totalElevationMeters,
            lastLapTime: mostRecentLap.time_seconds,
            chartData: chartData,
        },
        error: null,
  }
}

// Get stats of the all team
export async function getTeamStats(teamId) {
    const result = await supabase
        .from('laps')
        .select('time_seconds, lap_count, team_rider_id, team_riders!inner(team_id)')
        .eq('team_riders.team_id', teamId)

    if (result.error) {
        return { stats: null, error: result.error }
    }

    const laps = result.data

    if (laps.length === 0) {
        return {
        stats: {
            totalRelays: 0,
            totalLaps: 0,
            averageLapTime: null,
            averageSpeed: null,
            totalDistanceKm: 0,
            totalElevationMeters: 0,
        },
        error: null,
        }
    }

    let totalTime = 0
    let totalLaps = 0

    for (const lap of laps) {
        totalTime = totalTime + lap.time_seconds
        totalLaps = totalLaps + lap.lap_count
    }

    const averageLapTime = totalTime / totalLaps
    const averageSpeed = CIRCUIT_LENGTH_KM / (averageLapTime / 3600)
    const totalDistanceKm = totalLaps * CIRCUIT_LENGTH_KM
    const totalElevationMeters = totalLaps * CIRCUIT_ELEVATION_METERS

    return {
        stats: {
        totalRelays: laps.length,
        totalLaps: totalLaps,
        averageLapTime: averageLapTime,
        averageSpeed: averageSpeed,
        totalDistanceKm: totalDistanceKm,
        totalElevationMeters: totalElevationMeters,
        },
        error: null,
    }
}

// Update a rider priority_order
export async function updateRiderStatus(teamRiderId, newStatus) {
    const updateResult = await supabase
        .from('team_riders')
        .update({ status: newStatus })
        .eq('id', teamRiderId)

    return { error: updateResult.error }
}

// Autofill queue
export async function setAutoFill(teamId, isOn) {
    const updateResult = await supabase
        .from('teams')
        .update({ auto_fill: isOn })
        .eq('id', teamId)

    return { error: updateResult.error }
}


// Get last ran time to compose autofilling queue
async function getLastRanTimes(teamId, riderIds) {

    // Get every lap for these riders
    const lapsResult = await supabase
        .from('laps')
        .select('team_rider_id, created_at')
        .in('team_rider_id', riderIds)

    if (lapsResult.error) {
        return { lastRanTimes: null, error: lapsResult.error }
    }

    const allLaps = lapsResult.data

    // For each rider, find their most recent lap's timestamp
    // build a plain object: riderId -> most recent timestamp (or null)
    const lastRanTimes = {}

    for (const riderId of riderIds) {
        lastRanTimes[riderId] = null
    }

    for (const lap of allLaps) {
        const currentLatest = lastRanTimes[lap.team_rider_id]

        if (!currentLatest || lap.created_at > currentLatest) {
            lastRanTimes[lap.team_rider_id] = lap.created_at
        }
    }

    // If someone is currently running, their leg's start time
    // counts as more recent than any past completed lap
    const teamResult = await supabase
        .from('teams')
        .select('current_rider_id, current_leg_started_at')
        .eq('id', teamId)
        .single()

    if (teamResult.error) {
        return { lastRanTimes: null, error: teamResult.error }
    }

    const currentRiderId = teamResult.data.current_rider_id
    const currentLegStartedAt = teamResult.data.current_leg_started_at

    if (currentRiderId && currentLegStartedAt) {
        const existingValue = lastRanTimes[currentRiderId]

        if (!existingValue || currentLegStartedAt > existingValue) {
            lastRanTimes[currentRiderId] = currentLegStartedAt
        }
    }

    return { lastRanTimes, error: null }
}

export async function setAutoFillTarget(teamId, newTarget) {
    console.log("coucou")
  const updateResult = await supabase
    .from('teams')
    .update({ auto_fill_target: newTarget })
    .eq('id', teamId)

  return { error: updateResult.error }
}

export async function emptyQueue(teamId) {
    // Get the queue of the team
    const currentQueue = await supabase
        .from('run_queue')
        .select('*')
        .eq('team_id', teamId)

    if (currentQueue.error) {
        return { error: currentQueue.error }
    }

    const queue = currentQueue.data

    if (queue.length === 0) {
        return { error: null }
    }

    // Remove all inactive or resting riders
    for (const queueEntry of queue) {
        // Remove that entry from the queue
        const deleteResult = await supabase
            .from('run_queue')
            .delete()
            .eq('id', queueEntry.id)

        if (deleteResult.error) {
            return { error: deleteResult.error }
        }
    }

    return { error: null }
}

// Used to edit lap history
export async function updateLapTime(lapId, newTimeSeconds) {
    const updateResult = await supabase
        .from('laps')
        .update({ time_seconds: newTimeSeconds })
        .eq('id', lapId)

    return { error: updateResult.error }
}