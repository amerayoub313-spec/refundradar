import { getKPIMetrics, getRefundTrends, getApps } from '@/lib/services/database';
import { KPICard, TrendsChart, RecentAlertsTable } from '@/components/dashboard';
import { Shield, AlertTriangle, TrendingUp, Users } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

async function DashboardContent() {
  const [kpis, trends, apps] = await Promise.all([
    getKPIMetrics(),
    getRefundTrends(undefined, 30),
    getApps(),
  ]);

  if (apps.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-text-primary">Dashboard</h1>
            <p className="text-text-secondary mt-1">No apps connected yet</p>
          </div>
        </div>
        
        <Card className="border-risk-yellow-200 bg-risk-yellow-50/50 dark:bg-risk-yellow-900/20 dark:border-risk-yellow-800">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <AlertTriangle className="h-6 w-6 text-risk-yellow-500 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-risk-yellow-700 dark:text-risk-yellow-400">No apps connected</h3>
                <p className="text-sm text-risk-yellow-600 dark:text-risk-yellow-500 mt-1">
                  Add your RevenueCat API credentials in Settings to start monitoring refunds.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-text-primary">Dashboard</h1>
          <p className="text-text-secondary mt-1">Overview of your refund protection status</p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KPICard
          title="Total Refunds Inspected"
          value={kpis.total_refunds_inspected.toLocaleString()}
          icon={<Shield className="h-6 w-6 text-primary-500" />}
          iconColor="bg-primary-50 text-primary-500 dark:bg-primary-900/20"
        />
        <KPICard
          title="High-Risk Caught"
          value={kpis.high_risk_caught.toLocaleString()}
          icon={<AlertTriangle className="h-6 w-6 text-risk-red-500" />}
          iconColor="bg-risk-red-50 text-risk-red-500 dark:bg-risk-red-900/20"
        />
        <KPICard
          title="Revenue Saved"
          value={`$${kpis.revenue_saved_usd.toLocaleString()}`}
          icon={<TrendingUp className="h-6 w-6 text-risk-green-500" />}
          iconColor="bg-risk-green-50 text-risk-green-500 dark:bg-risk-green-900/20"
        />
        <KPICard
          title="Active Apps"
          value={kpis.active_apps}
          icon={<Users className="h-6 w-6 text-text-secondary" />}
          iconColor="bg-bg-tertiary text-text-secondary"
        />
      </div>

      {/* Charts & Recent Alerts */}
      <div className="grid gap-6 lg:grid-cols-2">
        <TrendsChart data={trends} title="Refund Trends (Last 30 Days)" height={350} />
        <RecentAlertsTable alerts={[]} />
      </div>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64 mt-2" />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map(i => (
          <Card key={i} className="p-6">
            <Skeleton className="h-4 w-32 mb-2" />
            <Skeleton className="h-8 w-24" />
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="h-[350px]">
          <CardContent className="h-full flex items-center justify-center">
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 space-y-4">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default async function DashboardPage() {
  return (
    <>
      <DashboardContent />
    </>
  );
}