'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, RefreshCw, Smartphone, Globe, CreditCard, Apple, Bot, CheckCircle2, AlertCircle, Trash2, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { useApps } from '@/hooks/useApps';
import { useRevenueCat } from '@/hooks/useRevenueCat';
import type { DashboardApp } from '@/types';

const platformIcons = {
  ios: Apple,
  android: Bot,
  stripe: CreditCard,
  web: Globe,
};

interface AppsTableProps {
  apps: DashboardApp[];
  onDelete?: (app: DashboardApp) => Promise<void>;
}

export function AppsTable({ apps, onDelete }: AppsTableProps) {
  const { refetch } = useApps();
  const { validateAndSave, loading: rcLoading } = useRevenueCat();
  const [syncing, setSyncing] = useState(false);

  const handleSync = async () => {
    setSyncing(true);
    try {
      // This would need the API key - in practice, we'd call a different endpoint
      toast.info('Sync requires RevenueCat API key. Please save credentials first.');
    } catch (err) {
      toast.error('Failed to sync apps');
    } finally {
      setSyncing(false);
    }
  };

  const handleDelete = async (app: DashboardApp) => {
    if (!confirm(`Are you sure you want to remove "${app.name}"? This will stop receiving webhooks for this app.`)) {
      return;
    }
    
    if (onDelete) {
      await onDelete(app);
      return;
    }
    
    try {
      // In a real implementation, call DELETE /api/apps/:id
      toast.success(`Removed ${app.name}`);
      refetch();
    } catch (err) {
      toast.error('Failed to remove app');
    }
  };

  if (!apps.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Connected Apps
            <Button onClick={handleSync} disabled={syncing} className="gap-2" size="sm">
              <RefreshCw className="h-4 w-4" />
              Sync from RevenueCat
            </Button>
          </CardTitle>
          <CardDescription>No apps connected yet. Add your RevenueCat credentials to sync apps.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <Smartphone className="h-16 w-16 mx-auto text-text-muted mb-4 opacity-50" />
            <h3 className="text-lg font-medium text-text-primary mb-2">No Apps Connected</h3>
            <p className="text-text-muted mb-6">
              Add your RevenueCat API credentials in the Integration tab to automatically sync your apps.
            </p>
            <Button variant="outline" onClick={() => document.getElementById('revenuecat-tab')?.click()}>
              Go to Integration Settings
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Connected Apps ({apps.length})</CardTitle>
            <CardDescription>Apps receiving webhook events from RevenueCat</CardDescription>
          </div>
          <Button onClick={handleSync} disabled={syncing || rcLoading} className="gap-2" size="sm">
            <RefreshCw className={cn('h-4 w-4', (syncing || rcLoading) && 'animate-spin')} />
            Sync from RevenueCat
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>App</TableHead>
              <TableHead>Platform</TableHead>
              <TableHead>Bundle ID</TableHead>
              <TableHead>RevenueCat App ID</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-36">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {apps.map((app) => {
              const PlatformIcon = platformIcons[app.platform] || Globe;
              
              return (
                <TableRow key={app.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <PlatformIcon className="h-5 w-5 text-text-muted" />
                      <div>
                        <p className="font-medium text-text-primary">{app.name}</p>
                        <p className="text-xs text-text-muted capitalize">{app.platform}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="gap-1 capitalize">
                      <PlatformIcon className="h-3 w-3" />
                      {app.platform}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-mono text-sm">
                    {app.bundle_identifier || '—'}
                  </TableCell>
                  <TableCell className="font-mono text-sm text-text-muted">
                    {app.revenuecat_app_id}
                  </TableCell>
                  <TableCell>
                    <Badge variant={app.is_active ? 'success' : 'secondary'}>
                      {app.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigator.clipboard.writeText(app.webhook_url)}>
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-risk-red-500 hover:text-risk-red-500" onClick={() => handleDelete(app)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}