import { supabase } from './supabase'

// Get everything needed to render the Main page for a team
export async function getTeamState(teamId) {
    const { data: team, error: teamError } = await supabase
        .from('teams')
        .select('*, current_rider:current_rider_id(id, name, avatar_url)')
        .eq('id', teamId)
        .single()

    if (teamError) return { error: teamError }

    const { data: queue, error: queueError } = await supabase
        .from('run_queue')
        .select('*, team_rider:team_rider_id(id, name, avatar_url)')
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

// Move the front of the queue into "current rider", removing it from the queue
export async function advanceQueue(teamId) {
    // Find the front of the queue (the next rider in line)
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
        return { error: { message: 'Queue is empty' } }
    }

    // Promote that entry to be the current runner
    const updateTeamResult = await supabase
        .from('teams')
        .update({
        current_rider_id: nextEntry.team_rider_id,
        current_leg_started_at: new Date().toISOString(),
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
    const targetLength = 15

    // How many real entries are currently in the queue?
    const currentQueueResult = await supabase
        .from('run_queue')
        .select('id')
        .eq('team_id', teamId)

    if (currentQueueResult.error) {
        return { error: currentQueueResult.error }
    }

    const currentLength = currentQueueResult.data.length

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
        .order('default_order', { ascending: true })

    if (ridersResult.error) {
        return { error: ridersResult.error }
    }

    const activeRiders = ridersResult.data

    if (activeRiders.length === 0) {
        // No active riders exist, nothing we can fill the queue with
        return { error: null }
    }

    // Figure out the next available position number
    const lastPositionResult = await supabase
        .from('run_queue')
        .select('position')
        .eq('team_id', teamId)
        .order('position', { ascending: false })
        .limit(1)
        .maybeSingle()

    let nextPosition = 1
    if (lastPositionResult.data) {
        nextPosition = lastPositionResult.data.position + 1
    }

    // How many new rows do we need to insert?
    const howManyToAdd = targetLength - currentLength

    // Build the new rows, cycling through activeRiders as needed
    const newRows = []

    for (let i = 0; i < howManyToAdd; i++) {
        const riderIndex = i % activeRiders.length
        const rider = activeRiders[riderIndex]

        newRows.push({
        team_id: teamId,
        team_rider_id: rider.id,
        lap_count: 1,
        position: nextPosition + i,
        })
    }

    // Insert these new rows into run_queue
    const insertResult = await supabase
        .from('run_queue')
        .insert(newRows)

    return { error: insertResult.error }
}