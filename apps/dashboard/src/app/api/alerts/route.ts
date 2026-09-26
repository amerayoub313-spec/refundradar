import { NextRequest, NextResponse } from 'next/server';
import { getRefundEvents } from '@/lib/services/database';
import { PaginationQuerySchema } from '@/lib/validations';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    const params = {
      appId: searchParams.get('appId') || undefined,
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '25'),
      riskLevel: searchParams.get('riskLevel') as 'green' | 'yellow' | 'red' | undefined,
      status: searchParams.get('status') as 'pending' | 'acknowledged' | 'dismissed' | 'revoked' | undefined,
      startDate: searchParams.get('startDate') || undefined,
      endDate: searchParams.get('endDate') || undefined,
      search: searchParams.get('search') || undefined,
    };

    const validation = PaginationQuerySchema.safeParse(params);
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid query parameters', details: validation.error.issues },
        { status: 400 }
      );
    }

    const result = await getRefundEvents(validation.data);
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    console.error('Get refund events error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch refund events' },
      { status: 500 }
    );
  }
}