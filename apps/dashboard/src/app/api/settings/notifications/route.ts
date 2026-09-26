import { NextRequest, NextResponse } from 'next/server';
import { getNotificationPreferences, updateNotificationPreferences } from '@/lib/services/database';
import { NotificationPreferencesSchema } from '@/lib/validations';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const prefs = await getNotificationPreferences();
    return NextResponse.json({ success: true, data: prefs });
  } catch (error) {
    console.error('Get notification preferences error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch preferences' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = NotificationPreferencesSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid preferences', details: validation.error.issues },
        { status: 400 }
      );
    }
    
    await updateNotificationPreferences(validation.data);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Update notification preferences error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update preferences' },
      { status: 500 }
    );
  }
}