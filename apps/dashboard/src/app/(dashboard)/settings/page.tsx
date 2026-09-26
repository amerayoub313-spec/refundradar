import { RevenueCatForm } from '@/components/settings/RevenueCatForm';
import { WebhookConfig } from '@/components/settings/WebhookConfig';
import { AppsTable } from '@/components/settings/AppsTable';
import { NotificationPreferences } from '@/components/settings/NotificationPreferences';
import { getApps } from '@/lib/services/database';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Settings, Shield, Globe, Bell } from 'lucide-react';

async function SettingsContent() {
  const apps = await getApps();

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-text-primary">Settings</h1>
          <p className="text-text-secondary mt-1">Manage your RefundRadar configuration</p>
        </div>
      </div>

      <Tabs defaultValue="revenuecat" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="revenuecat">
            <Shield className="h-4 w-4 mr-2" />
            RevenueCat
          </TabsTrigger>
          <TabsTrigger value="webhook">
            <Globe className="h-4 w-4 mr-2" />
            Webhooks
          </TabsTrigger>
          <TabsTrigger value="apps">
            <Globe className="h-4 w-4 mr-2" />
            Apps
          </TabsTrigger>
          <TabsTrigger value="notifications">
            <Bell className="h-4 w-4 mr-2" />
            Notifications
          </TabsTrigger>
        </TabsList>

        <TabsContent value="revenuecat" className="animate-slide-up">
          <RevenueCatForm />
        </TabsContent>

        <TabsContent value="webhook" className="animate-slide-up">
          <WebhookConfig status={null} />
        </TabsContent>

        <TabsContent value="apps" className="animate-slide-up">
          <AppsTable apps={apps} />
        </TabsContent>

        <TabsContent value="notifications" className="animate-slide-up">
          <NotificationPreferences />
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default async function SettingsPage() {
  return (
    <div className="space-y-6 animate-fade-in">
      <SettingsContent />
    </div>
  );
}