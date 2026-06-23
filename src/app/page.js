'use client'

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"

export default function Home(){
  const [teams, setTeams] = useState([])

  useEffect(() => {
    async function fetchTeams() {
      const {data, error} = await supabase.from('teams').select('*')
      if (error) console.error(error)
      else setTeams(data)
      }
    fetchTeams()
   }, [])

  return(
    <div>
      <h1>Team test</h1>
      <pre>{JSON.stringify(teams, null, 2)}</pre>
    </div>
  )
}