import { NextRequest, NextResponse } from 'next/server';
import { revokeEntitlement } from '@/lib/services/database';
import { RevokeEntitlementSchema } from '@/lib/validations';
import { createClient } from '@/lib/supabase/server';

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

    // Get developer's RevenueCat API key
    const { data: creds } = await supabase
      .from('revenuecat_credentials')
      .select('api_key_encrypted')
      .eq('developer_id', user.id)
      .single();

    if (!creds) {
      return NextResponse.json(
        { success: false, error: 'RevenueCat credentials not configured' },
        { status: 400 }
      );
    }

    // In production, decrypt the API key
    // For now, we'll need to pass it from the client or use a different approach
    // This is a limitation of the current architecture - the API key should be available server-side
    
    const body = await request.json();
    const validation = RevokeEntitlementSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid request', details: validation.error.issues },
        { status: 400 }
      );
    }

    // NOTE: In production, the API key should be decrypted from the database
    // For this implementation, we'll return an error indicating the key needs to be provided
    // or implement proper key decryption using Supabase Vault
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'RevenueCat API key decryption not implemented. Use Worker endpoint for revocation.',
        code: 'NOT_IMPLEMENTED'
      },
      { status: 501 }
    );
  } catch (error) {
    console.error('Revoke entitlement error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to revoke entitlement' },
      { status: 500 }
    );
  }
}