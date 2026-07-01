import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
}

Deno.serve(async (req) => {

	// Handle the preflight OPTIONS request the browser sends first
	if (req.method === "OPTIONS") {
		return new Response(null, { status: 204, headers: corsHeaders })
	}

	if (req.method !== "POST") {
		return new Response("Method not allowed", { status: 405, headers: corsHeaders })
	}

	const authHeader = req.headers.get("Authorization")

	if (!authHeader) {
		return new Response("Unauthorized", { status: 401, headers: corsHeaders })
	}

	const userClient = createClient(
		Deno.env.get("SUPABASE_URL") ?? "",
		Deno.env.get("SUPABASE_ANON_KEY") ?? "",
		{ global: { headers: { Authorization: authHeader } } }
	)

	const { data: { user }, error: userError } = await userClient.auth.getUser()

	if (userError || !user) {
		return new Response("Unauthorized", { status: 401, headers: corsHeaders })
	}

	const adminClient = createClient(
		Deno.env.get("SUPABASE_URL") ?? "",
		Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
	)

	const { error: deleteError } = await adminClient.auth.admin.deleteUser(user.id)

	if (deleteError) {
		return new Response(
		JSON.stringify({ error: deleteError.message }),
		{ status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
		)
	}

	return new Response(
		JSON.stringify({ success: true }),
		{ status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
	)
})