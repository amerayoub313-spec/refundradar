import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { syncAppsFromRevenueCat, getDecryptedRevenueCatApiKey } from '@/lib/services/database';

export async function POST() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get decrypted RevenueCat API key
    const apiKey = await getDecryptedRevenueCatApiKey();
    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: 'RevenueCat API key not configured' },
        { status: 400 }
      );
    }

    // Sync apps from RevenueCat
    const apps = await syncAppsFromRevenueCat(apiKey);

    return NextResponse.json({ 
      success: true, 
      data: { 
        apps_found: apps.length,
        apps 
      } 
    });
  } catch (error) {
    console.error('Sync apps error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to sync apps from RevenueCat' },
      { status: 500 }
    );
  }
}