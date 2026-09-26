import { getRefundEvents } from '@/lib/services/database';
import { AlertsPageClient } from './page.client';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';

async function AlertsPage({ searchParams }: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
  const params = await searchParams;
  const eventId = params.eventId as string | undefined;
  
  const page = parseInt(params.page as string || '1');
  const limit = 25;
  const riskLevel = params.risk_level as 'green' | 'yellow' | 'red' | undefined;
  const status = params.status as 'pending' | 'acknowledged' | 'dismissed' | 'revoked' | undefined;
  const search = params.search as string | undefined;
  const startDate = params.start_date as string | undefined;
  const endDate = params.end_date as string | undefined;

  const result = await getRefundEvents({
    page,
    limit,
    riskLevel,
    status,
    search,
    startDate,
    endDate,
  });

  return (
    <AlertsPageClient
      initialData={result.data}
      initialMeta={result.meta}
      initialFilters={{ riskLevel, status, search, startDate, endDate }}
      initialEventId={eventId}
    />
  );
}

function AlertsPageSkeleton() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64 mt-2" />
        </div>
      </div>
      <Card>
        <CardContent className="p-4 space-y-4">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-6 space-y-4">
          {[1, 2, 3, 4, 5].map(i => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

export default AlertsPage;