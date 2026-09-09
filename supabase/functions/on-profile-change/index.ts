import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

serve(async (req) => {
  const secret = Deno.env.get("INTERNAL_API_SECRET")
  const backendUrl = Deno.env.get("FASTAPI_BACKEND_URL")
  
  if (!secret || !backendUrl) {
    return new Response(
      JSON.stringify({ error: "Missing environment configuration on Edge Function" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    )
  }
  
  try {
    const payload = await req.json()
    const { record, type } = payload
    
    // Re-match when a new active user profile is created
    if ((type === "INSERT" || type === "UPDATE") && record && record.is_current === true) {
      const response = await fetch(`${backendUrl}/api/internal/match-profile`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Internal-Secret": secret
        },
        body: JSON.stringify({ user_id: record.user_id })
      })
      
      const resData = await response.json()
      return new Response(JSON.stringify({ status: "processed", backend: resData }), {
        headers: { "Content-Type": "application/json" },
        status: response.status
      })
    }
    
    return new Response(JSON.stringify({ status: "ignored", type }), {
      headers: { "Content-Type": "application/json" }
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { "Content-Type": "application/json" }
    })
  }
})
