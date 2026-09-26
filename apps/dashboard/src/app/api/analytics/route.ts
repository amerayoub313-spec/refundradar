import { NextRequest, NextResponse } from 'next/server';
import { getKPIMetrics, getRefundTrends } from '@/lib/services/database';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const appId = searchParams.get('appId') || undefined;
    const days = parseInt(searchParams.get('days') || '30');
    
    const [kpis, trends] = await Promise.all([
      getKPIMetrics(appId),
      getRefundTrends(appId, days),
    ]);
    
    return NextResponse.json({ 
      success: true, 
      data: { kpis, trends } 
    });
  } catch (error) {
    console.error('Get analytics error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}