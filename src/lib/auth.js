import { supabase } from "@/lib/supabase"


// Simple user sign up
export async function signUp(email, password, username) {
    const { data, error } = await supabase.auth.signUp({ email, password })
    if (error) return { error }

    const { error: profileError } = await supabase
        .from('profiles')
        .insert({ id: data.user.id, username })

    return { error: profileError }
}


// Login
export async function login(email, password) {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return { error }
}


// Insert a rider in a team
export async function addRider(teamId, name, profileId = null) {
    
        // You also record membership if a rider is linked to a real account
        if (profileId){
            const { error: membershipError } = await supabase
                .from("team_memberships")
                .insert({ team_id: teamId, user_id: profileId})

             if (membershipError) return { error: membershipError }
        }

        const { error } = await supabase
            .from('team_riders')
            .insert({
            team_id: teamId,
            profile_id: profileId, // null = placeholder, an id = self or claimed
            name,
        })

    return { error }
}



// You must be a logged-in user to create OR join a team
export async function createTeam(teamName, username) {
    const joinCode = Math.random().toString(36).substring(2, 8).toUpperCase() // e.g. "K3F9XQ"


    const { data: team, error } = await supabase
        .from('teams')
        .insert({ name: teamName, join_code: joinCode })
        .select()
        .single()

    if (error) return { error }

    const { data: userData, error: userError } = await supabase.auth.getUser()
    if (userError || !userData?.user) {
        return { error: { message: 'Could not confirm logged-in user. Try refreshing and retrying.' } }
  }

    console.log('team:', team)
    console.log('userData.user:', userData.user)

    const { error: riderError } = await addRider(team.id, username, userData.user.id)

    return { error: riderError, team }
}

// Via the join code you can join and or create team_rider or claim one.
export async function joinTeam(joinCode, username) {

    console.log(joinCode, username)

    const { data: team, error } = await supabase
        .from('teams')
        .select('id')
        .eq('join_code', joinCode)
        .single()

    if (error) return { error: { message: 'Invalid join code' } }
   
    const { data: userData } = await supabase.auth.getUser()
    const { error: riderError } = await addRider(team.id, username, userData.user.id)

    return { error: riderError, team }
}

// Find already joined team
export async function getMyTeamRider() {
    const { data: userData } = await supabase.auth.getUser()

    const { data, error} = await supabase
        .from("team_riders")
        .select("id, team_id")
        .eq("profile_id", userData.user.id)
        .maybeSingle()
    
        return { data, error}
}

// Placeholder rider
export async function addPlaceholderRider(teamId, name) {
    return addRider(teamId, name) // profileId stays null
}


// Claim an existing placeholder rider (added by a teammate, no account yet)
export async function claimRider(teamRiderId) {
    const { data: userData } = await supabase.auth.getUser()

    const { error } = await supabase
        .from('team_riders')
        .update({ profile_id: userData.user.id })
        .eq('id', teamRiderId)
        .is('profile_id', null)

    return { error }
}

// On joining a team
export async function getTeamByJoinCode(joinCode) {
    const teamResult = await supabase
        .from('teams')
        .select('id, name')
        .eq('join_code', joinCode)
        .single()

    return { team: teamResult.data, error: teamResult.error }
}

export async function getUnclaimedRiders(teamId) {
    const ridersResult = await supabase
        .from('team_riders')
        .select('id, name')
        .eq('team_id', teamId)
        .eq('status', 'active')
        .is('profile_id', null)

    return { riders: ridersResult.data, error: ridersResult.error }
}

export async function getTeamJoinCode(teamId) {
    const result = await supabase
        .from('teams')
        .select('join_code')
        .eq('id', teamId)
        .single()

    return { joinCode: result.data ? result.data.join_code : null, error: result.error }
}