import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

async function checkAdmin() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) return { error: 'Unauthorized', status: 401 }

  const { data: userData } = await (supabase
    .from('users') as any)
    .select('roles')
    .eq('auth_user_id', user.id)
    .single() as { data: { roles: string[] | null } | null }

  if (!userData?.roles?.includes('admin')) return { error: 'Forbidden', status: 403 }
  return { user, supabase }
}

export async function GET() {
  try {
    const auth = await checkAdmin()
    if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status })
    const { supabase } = auth

    // Fetch groups
    const { data: groups, error: groupsError } = await (supabase
      .from('email_template_groups') as any)
      .select('*')
      .order('created_at', { ascending: true })

    if (groupsError) return NextResponse.json({ error: groupsError.message }, { status: 500 })

    // Fetch templates
    const { data: templates, error: templatesError } = await (supabase
      .from('email_templates') as any)
      .select('*')
      .order('created_at', { ascending: true })

    if (templatesError) return NextResponse.json({ error: templatesError.message }, { status: 500 })

    return NextResponse.json({ groups: groups || [], templates: templates || [] })
  } catch (err: any) {
    console.error('[EmailTemplates] GET error:', err)
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const auth = await checkAdmin()
    if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status })
    const { supabase } = auth

    const body = await request.json()
    const { type } = body

    if (type === 'group') {
      const { name, slug, description } = body
      if (!name || !slug) return NextResponse.json({ error: 'Name and slug are required' }, { status: 400 })

      const { data, error } = await (supabase
        .from('email_template_groups') as any)
        .insert({ name, slug, description: description || null })
        .select()
        .single()

      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      return NextResponse.json(data)
    }

    // Default: create template
    const { name, slug, subject, bodyContent, group_id, variables } = body
    if (!name || !slug) return NextResponse.json({ error: 'Name and slug are required' }, { status: 400 })

    const { data, error } = await (supabase
      .from('email_templates') as any)
      .insert({
        name,
        slug,
        subject: subject || '',
        body: bodyContent || '',
        group_id: group_id || null,
        variables: variables || [],
      })
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  } catch (err: any) {
    console.error('[EmailTemplates] POST error:', err)
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const auth = await checkAdmin()
    if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status })
    const { supabase } = auth

    const body = await request.json()
    const { type } = body

    if (type === 'group') {
      const { id, name, description } = body
      if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 })

      const updateData: Record<string, any> = { updated_at: new Date().toISOString() }
      if (name !== undefined) updateData.name = name
      if (description !== undefined) updateData.description = description

      const { error } = await (supabase
        .from('email_template_groups') as any)
        .update(updateData)
        .eq('id', id)

      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      return NextResponse.json({ success: true })
    }

    // Default: update template
    const { id, name, subject, bodyContent, group_id, variables, is_active } = body
    if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 })

    const updateData: Record<string, any> = { updated_at: new Date().toISOString() }
    if (name !== undefined) updateData.name = name
    if (subject !== undefined) updateData.subject = subject
    if (bodyContent !== undefined) updateData.body = bodyContent
    if (group_id !== undefined) updateData.group_id = group_id
    if (variables !== undefined) updateData.variables = variables
    if (is_active !== undefined) updateData.is_active = is_active

    const { error } = await (supabase
      .from('email_templates') as any)
      .update(updateData)
      .eq('id', id)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('[EmailTemplates] PUT error:', err)
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const auth = await checkAdmin()
    if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status })
    const { supabase } = auth

    const body = await request.json()
    const { id, type } = body

    if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 })

    if (type === 'group') {
      // Move templates to ungrouped before deleting group
      await (supabase
        .from('email_templates') as any)
        .update({ group_id: null })
        .eq('group_id', id)

      const { error } = await (supabase
        .from('email_template_groups') as any)
        .delete()
        .eq('id', id)

      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      return NextResponse.json({ success: true })
    }

    // Default: delete template
    const { error } = await (supabase
      .from('email_templates') as any)
      .delete()
      .eq('id', id)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('[EmailTemplates] DELETE error:', err)
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 })
  }
}
