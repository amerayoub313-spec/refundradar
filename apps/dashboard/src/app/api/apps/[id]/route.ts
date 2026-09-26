import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;

    // Verify the app belongs to the user
    const { data: app, error: appError } = await supabase
      .from('apps')
      .select('id, developer_id')
      .eq('id', id)
      .single();

    if (appError || !app) {
      return NextResponse.json(
        { success: false, error: 'App not found' },
        { status: 404 }
      );
    }

    if (app.developer_id !== user.id) {
      return NextResponse.json(
        { success: false, error: 'Access denied' },
        { status: 403 }
      );
    }

    // Soft delete - mark as inactive
    const { error } = await supabase
      .from('apps')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      return NextResponse.json(
        { success: false, error: 'Failed to delete app' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete app error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete app' },
      { status: 500 }
    );
  }
}