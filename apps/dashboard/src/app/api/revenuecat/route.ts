import { NextRequest, NextResponse } from 'next/server';
import { getRevenueCatStatus, validateRevenueCatApiKey, syncAppsFromRevenueCat, updateRevenueCatCredentials } from '@/lib/services/database';
import { RevenueCatCredentialsSchema } from '@/lib/validations';

export async function GET() {
  try {
    const status = await getRevenueCatStatus();
    return NextResponse.json({ success: true, data: status });
  } catch (error) {
    console.error('Get RevenueCat status error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch RevenueCat status' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = RevenueCatCredentialsSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid credentials', details: validation.error.issues },
        { status: 400 }
      );
    }
    
    // Validate the API key first
    const validationResult = await validateRevenueCatApiKey(validation.data.api_key);
    if (!validationResult.valid) {
      return NextResponse.json(
        { success: false, error: 'Invalid RevenueCat API key' },
        { status: 400 }
      );
    }
    
    // Store credentials
    await updateRevenueCatCredentials(validation.data.api_key, validation.data.webhook_secret);
    
    // Sync apps
    const apps = await syncAppsFromRevenueCat(validation.data.api_key);
    
    return NextResponse.json({ 
      success: true, 
      data: { 
        validated: true, 
        apps_found: apps.length,
        apps 
      } 
    });
  } catch (error) {
    console.error('Save RevenueCat credentials error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to save credentials' },
      { status: 500 }
    );
  }
}