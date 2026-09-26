import { NextRequest, NextResponse } from 'next/server';
import { updateAlertStatus } from '@/lib/services/database';
import { AlertActionSchema } from '@/lib/validations';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    
    const validation = AlertActionSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid action', details: validation.error.issues },
        { status: 400 }
      );
    }
    
    await updateAlertStatus(id, validation.data.action);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Update alert status error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update alert status' },
      { status: 500 }
    );
  }
}