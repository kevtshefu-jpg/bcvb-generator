import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceRoleKey = Deno.env.get('SERVICE_ROLE_KEY')!

    const adminClient = createClient(supabaseUrl, serviceRoleKey)

    const body = await req.json()
    const {
      request_id,
      email,
      first_name,
      last_name,
      category_requested,
      role_requested,
      approved_by,
    } = body ?? {}

    if (!request_id || !email || !first_name || !last_name) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const fullName = `${first_name} ${last_name}`.trim()
    const tempPassword = crypto.randomUUID().slice(0, 12) + 'Aa1!'

    const { data: createdUser, error: createUserError } =
      await adminClient.auth.admin.createUser({
        email,
        password: tempPassword,
        email_confirm: true,
        user_metadata: {
          full_name: fullName,
        },
      })

    if (createUserError) {
      return new Response(
        JSON.stringify({ error: createUserError.message }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const userId = createdUser.user.id

    const { error: profileError } = await adminClient
      .from('profiles')
      .upsert({
        id: userId,
        email,
        full_name: fullName,
        role: role_requested || 'joueur',
        category_id: category_requested || null,
        is_active: true,
      })

    if (profileError) {
      return new Response(
        JSON.stringify({ error: profileError.message }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const { error: requestError } = await adminClient
      .from('registration_requests')
      .update({
        status: 'approved',
        approved_by: approved_by ?? null,
        approved_at: new Date().toISOString(),
        approved_profile_id: userId,
      })
      .eq('id', request_id)

    if (requestError) {
      return new Response(
        JSON.stringify({ error: requestError.message }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({
        success: true,
        user_id: userId,
        temporary_password: tempPassword,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})
