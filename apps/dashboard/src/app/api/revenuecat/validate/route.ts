import { NextRequest, NextResponse } from 'next/server';
import { validateRevenueCatApiKey } from '@/lib/services/database';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { api_key } = body;
    
    if (!api_key || typeof api_key !== 'string') {
      return NextResponse.json(
        { success: false, error: 'API key is required' },
        { status: 400 }
      );
    }
    
    const result = await validateRevenueCatApiKey(api_key);
    
    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error('Validate RevenueCat API key error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to validate API key' },
      { status: 500 }
    );
  }
}