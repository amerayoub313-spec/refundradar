import { NextRequest, NextResponse } from 'next/server';
import { getRefundEventDetail } from '@/lib/services/database';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const detail = await getRefundEventDetail(id);
    
    if (!detail) {
      return NextResponse.json(
        { success: false, error: 'Event not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ success: true, data: detail });
  } catch (error) {
    console.error('Get event detail error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch event detail' },
      { status: 500 }
    );
  }
}