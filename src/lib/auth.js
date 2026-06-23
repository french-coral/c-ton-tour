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


// Insert a rider_profile into team_riders
export async function addRider(teamId, name, avatarUrl = null, profileId = null) {
  const { error } = await supabase
    .from('team_riders')
    .insert({
      team_id: teamId,
      profile_id: profileId, // null = placeholder, an id = self or claimed
      name,
      avatar_url: avatarUrl,
    })
  return { error }
}



// You must be a logged-in user to create OR join a team
export async function createTeam(teamName, username, avatarUrl = null) {
  const joinCode = Math.random().toString(36).substring(2, 8).toUpperCase() // e.g. "K3F9XQ"


  const { data: team, error } = await supabase
    .from('teams')
    .insert({ name: teamName, join_code: joinCode })
    .select()
    .single()

  if (error) return { error }

  const { data: userData } = await supabase.auth.getUser()
  const { error: riderError } = await addRider(team.id, username, avatarUrl, userData.user.id)

  return { error: riderError, team }
}

// Via the join code you can join and or create team_rider or claim one.
export async function joinTeam(joinCode, username, avatarUrl = null) {
  const { data: team, error } = await supabase
    .from('teams')
    .select('id')
    .eq('join_code', joinCode)
    .single()

  if (error) return { error: { message: 'Invalid join code' } }

  const { data: userData } = await supabase.auth.getUser()
  const { error: riderError } = await addRider(team.id, username, avatarUrl, userData.user.id)

  return { error: riderError, team }
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