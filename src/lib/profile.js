import { supabase } from './supabase'

export async function getMyProfile() {
    const userResult = await supabase.auth.getUser()

    if (userResult.error || !userResult.data.user) {
        return { profile: null, error: { message: 'Not logged in' } }
    }

    const profileResult = await supabase
        .from('profiles')
        .select('id, username, avatar_url')
        .eq('id', userResult.data.user.id)
        .single()

    return { profile: profileResult.data, error: profileResult.error }
}

export async function updateMyProfileName(newUsername) {
    const userResult = await supabase.auth.getUser()

    if (userResult.error || !userResult.data.user) {
        return { error: { message: 'Not logged in' } }
    }

    const updateResult = await supabase
        .from('profiles')
        .update({ username: newUsername })
        .eq('id', userResult.data.user.id)

    return { error: updateResult.error }
}

export async function getMyTeamMembership() {
    const userResult = await supabase.auth.getUser()

    if (userResult.error || !userResult.data.user) {
        return { teamRider: null, error: { message: 'Not logged in' } }
    }

    const riderResult = await supabase
        .from('team_riders')
        .select('id, name, team:team_id(id, name)')
        .eq('profile_id', userResult.data.user.id)
        .maybeSingle()

    return { teamRider: riderResult.data, error: riderResult.error }
}

export async function updateMyTeamRiderName(teamRiderId, newName) {
    const updateResult = await supabase
        .from('team_riders')
        .update({ name: newName })
        .eq('id', teamRiderId)

    return { error: updateResult.error }
}

export async function uploadAvatar(file) {
    const userResult = await supabase.auth.getUser()

    if (userResult.error || !userResult.data.user) {
        return { error: { message: 'Not logged in' } }
    }

    const userId = userResult.data.user.id
    const fileExtension = file.name.split('.').pop()
    const filePath = userId + '/avatar.' + fileExtension

    const uploadResult = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true })

    if (uploadResult.error) {
        return { error: uploadResult.error }
    }

    const publicUrlResult = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath)

    const publicUrl = publicUrlResult.data.publicUrl

    const updateResult = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', userId)

    return { error: updateResult.error, avatarUrl: publicUrl }
}