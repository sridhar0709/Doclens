import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.8"

serve(async (req) => {
  const secret = Deno.env.get("INTERNAL_API_SECRET")
  const backendUrl = Deno.env.get("FASTAPI_BACKEND_URL")
  const supabaseUrl = Deno.env.get("SUPABASE_URL")
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
  
  if (!secret || !backendUrl || !supabaseUrl || !supabaseServiceKey) {
    return new Response(
      JSON.stringify({ error: "Missing environment configuration on Edge Function" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    )
  }
  
  const supabase = createClient(supabaseUrl, supabaseServiceKey)
  
  try {
    const payload = await req.json()
    const { record, old_record, type } = payload
    
    // Only care if eligibility_rules changed, or it's a new scheme
    const rulesChanged = type === "INSERT" || (
      type === "UPDATE" && 
      JSON.stringify(record.eligibility_rules) !== JSON.stringify(old_record?.eligibility_rules)
    )
    
    if (rulesChanged && record && record.is_active === true) {
      const rules = record.eligibility_rules || {}
      
      // Build dynamic Postgrest query to pre-filter candidates cheaply in the DB
      let query = supabase
        .from("citizen_profiles")
        .select("user_id")
        .eq("is_current", true)
        
      if (rules.state_restricted_to && rules.state_restricted_to.length > 0) {
        query = query.in("state", rules.state_restricted_to)
      }
      if (rules.max_annual_income !== null && rules.max_annual_income !== undefined) {
        query = query.lte("annual_income", rules.max_annual_income)
      }
      if (rules.allowed_occupations && rules.allowed_occupations.length > 0) {
        query = query.in("occupation", rules.allowed_occupations)
      }
      
      const { data: candidates, error } = await query
      if (error) throw error
      
      const candidateUserIds = (candidates || []).map(c => c.user_id)
      
      if (candidateUserIds.length > 0) {
        const response = await fetch(`${backendUrl}/api/internal/match-scheme`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Internal-Secret": secret
          },
          body: JSON.stringify({
            scheme_id: record.id,
            candidate_user_ids: candidateUserIds
          })
        })
        const resData = await response.json()
        return new Response(JSON.stringify({ status: "processed", backend: resData }), {
          headers: { "Content-Type": "application/json" },
          status: response.status
        })
      }
      
      return new Response(JSON.stringify({ status: "no_candidates" }), {
        headers: { "Content-Type": "application/json" }
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
