import { NextRequest, NextResponse } from 'next/server';
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

    // Get user email
    const { data: profile } = await supabase
      .from('developers')
      .select('email, full_name')
      .eq('id', user.id)
      .single();

    const email = profile?.email || user.email;
    const name = profile?.full_name;

    if (!email) {
      return NextResponse.json(
        { success: false, error: 'No email address found' },
        { status: 400 }
      );
    }

    // Send test email via Worker API (or directly via Resend if configured)
    // For now, we'll call the worker's test endpoint
    const workerUrl = process.env.NEXT_PUBLIC_WORKER_URL || 'https://ingest.refundradar.io';
    
    const response = await fetch(`${workerUrl}/api/test-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: email,
        name: name || 'Developer',
      }),
    });

    const result = await response.json();
    
    if (!response.ok) {
      return NextResponse.json(
        { success: false, error: result.error || 'Failed to send test email' },
        { status: response.status }
      );
    }

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error('Send test notification error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to send test notification' },
      { status: 500 }
    );
  }
}