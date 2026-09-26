'use client';

import { useState } from 'react';
import { AppsTable } from '@/components/settings/AppsTable';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, RefreshCw, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import type { DashboardApp } from '@/types';

interface AppsPageClientProps {
  initialApps: DashboardApp[];
}

export function AppsPageClient({ initialApps }: AppsPageClientProps) {
  const [apps, setApps] = useState(initialApps);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState({
    revenuecat_app_id: '',
    name: '',
    platform: 'ios' as 'ios' | 'android' | 'stripe' | 'web',
    bundle_identifier: '',
  });

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      const response = await fetch('/api/revenuecat/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      
      const result = await response.json();
      if (result.success) {
        setApps(result.data.apps);
        toast.success(`Synced ${result.data.apps_found} apps from RevenueCat`);
      } else {
        toast.error(result.error || 'Failed to sync apps');
      }
    } catch (err) {
      toast.error('Failed to sync apps');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
    
    try {
      const response = await fetch('/api/apps', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      
      const result = await response.json();
      if (result.success) {
        setApps([result.data, ...apps]);
        toast.success('App created successfully');
        setIsDialogOpen(false);
        setFormData({ revenuecat_app_id: '', name: '', platform: 'ios', bundle_identifier: '' });
      } else {
        toast.error(result.error || 'Failed to create app');
      }
    } catch (err) {
      toast.error('Failed to create app');
    } finally {
      setIsCreating(false);
    }
  };

  const handleDelete = async (app: DashboardApp) => {
    if (!confirm(`Are you sure you want to delete "${app.name}"? This will stop receiving webhooks for this app.`)) {
      return;
    }
    
    try {
      const response = await fetch(`/api/apps/${app.id}`, {
        method: 'DELETE',
      });
      
      const result = await response.json();
      if (result.success) {
        setApps(apps.filter(a => a.id !== app.id));
        toast.success('App deleted successfully');
      } else {
        toast.error(result.error || 'Failed to delete app');
      }
    } catch (err) {
      toast.error('Failed to delete app');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-text-primary">Connected Apps</h1>
          <p className="text-text-secondary mt-1">Manage your RevenueCat applications</p>
        </div>
        <div className="flex items-center gap-2">
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Add App
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New App</DialogTitle>
                <DialogDescription>
                  Manually add a RevenueCat app or sync from RevenueCat in the Integration tab.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreate}>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="revenuecat_app_id">RevenueCat App ID *</Label>
                    <Input
                      id="revenuecat_app_id"
                      placeholder="app_abc123"
                      value={formData.revenuecat_app_id}
                      onChange={(e) => setFormData(prev => ({ ...prev, revenuecat_app_id: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="name">App Name *</Label>
                    <Input
                      id="name"
                      placeholder="My Awesome App"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="platform">Platform *</Label>
                    <Select value={formData.platform} onValueChange={(v) => setFormData(prev => ({ ...prev, platform: v as any }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select platform" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ios">iOS</SelectItem>
                        <SelectItem value="android">Android</SelectItem>
                        <SelectItem value="stripe">Stripe</SelectItem>
                        <SelectItem value="web">Web</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bundle_identifier">Bundle Identifier</Label>
                    <Input
                      id="bundle_identifier"
                      placeholder="com.company.app"
                      value={formData.bundle_identifier}
                      onChange={(e) => setFormData(prev => ({ ...prev, bundle_identifier: e.target.value }))}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isCreating}>
                    {isCreating ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Creating...
                      </>
                    ) : (
                      'Create App'
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
          
          <Button variant="outline" onClick={handleSync} disabled={isSyncing} className="gap-2">
            <RefreshCw className={isSyncing ? 'h-4 w-4 animate-spin' : 'h-4 w-4'} />
            Sync from RevenueCat
          </Button>
        </div>
      </div>

      <AppsTable apps={apps} onDelete={handleDelete} />
    </div>
  );
}