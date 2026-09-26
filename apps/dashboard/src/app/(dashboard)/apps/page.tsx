import { getApps } from '@/lib/services/database';
import { AppsPageClient } from './page.client';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';

async function AppsPage() {
  const apps = await getApps();
  
  return (
    <AppsPageClient initialApps={apps} />
  );
}

export default AppsPage;