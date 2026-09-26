import { NextRequest, NextResponse } from 'next/server';
import { getApps, syncAppsFromRevenueCat } from '@/lib/services/database';
import { validateRevenueCatApiKey } from '@/lib/services/database';
import { createClient } from '@/lib/supabase/server';
import { AppRegistrationSchema } from '@/lib/validations';

export async function GET() {
  try {
    const apps = await getApps();
    return NextResponse.json({ success: true, data: apps });
  } catch (error) {
    console.error('Get apps error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch apps' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validation = AppRegistrationSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid input', details: validation.error.issues },
        { status: 400 }
      );
    }

    const { data: app, error } = await supabase
      .from('apps')
      .insert({
        developer_id: user.id,
        revenuecat_app_id: validation.data.revenuecat_app_id,
        name: validation.data.name,
        platform: validation.data.platform,
        bundle_identifier: validation.data.bundle_identifier,
        is_active: true,
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') { // Unique violation
        return NextResponse.json(
          { success: false, error: 'App already registered' },
          { status: 409 }
        );
      }
      throw error;
    }

    return NextResponse.json({ success: true, data: app }, { status: 201 });
  } catch (error) {
    console.error('Create app error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create app' },
      { status: 500 }
    );
  }
}