'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Bell, Mail, Clock, Save, Loader2, Send } from 'lucide-react';
import { toast } from 'sonner';
import { useNotifications } from '@/hooks/useNotifications';
import type { NotificationPreferences } from '@/types';

const THRESHOLD_OPTIONS = [
  { value: 'red', label: 'Red only (≥70)', description: 'Only notify for high-risk refunds' },
  { value: 'yellow', label: 'Yellow & Red (≥40)', description: 'Notify for both medium and high-risk refunds' },
] as const;

const FREQUENCY_OPTIONS = [
  { value: 'realtime', label: 'Real-time', description: 'Send email immediately when alert is created' },
  { value: 'hourly', label: 'Hourly digest', description: 'Batch notifications sent every hour' },
  { value: 'daily', label: 'Daily digest (9 AM UTC)', description: 'Single summary email sent daily' },
] as const;

export function NotificationPreferences() {
  const { preferences, loading, fetchPreferences, updatePreferences, sendTestEmail } = useNotifications();
  const [saving, setSaving] = useState(false);
  const [sendingTest, setSendingTest] = useState(false);
  const [localPrefs, setLocalPrefs] = useState<NotificationPreferences>({
    email_alerts_enabled: true,
    alert_threshold: 'red',
    digest_frequency: 'realtime',
    email_address: '',
  });

  // Sync local prefs with fetched data
  if (preferences && !loading) {
    setLocalPrefs(preferences);
  }

  const handleChange = (key: keyof NotificationPreferences, value: any) => {
    setLocalPrefs(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await updatePreferences(localPrefs);
      toast.success('Notification preferences saved');
    } catch (err) {
      toast.error('Failed to save preferences');
    } finally {
      setSaving(false);
    }
  };

  const handleTestEmail = async () => {
    setSendingTest(true);
    try {
      await sendTestEmail();
      toast.success('Test email sent! Check your inbox.');
    } catch (err) {
      toast.error('Failed to send test email');
    } finally {
      setSendingTest(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Email Alerts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Email Alerts
          </CardTitle>
          <CardDescription>Configure when and how you receive refund alert notifications</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Enable Email Alerts</p>
              <p className="text-sm text-text-muted">Receive email notifications for refund alerts</p>
            </div>
            <Switch
              checked={localPrefs.email_alerts_enabled}
              onCheckedChange={(checked) => handleChange('email_alerts_enabled', checked)}
              disabled={saving}
            />
          </div>

          <Separator />

          <div className="space-y-4">
            <Label>Alert Threshold</Label>
            <RadioGroup value={localPrefs.alert_threshold} onValueChange={(v) => handleChange('alert_threshold', v as 'red' | 'yellow')}>
              <div className="space-y-3">
                {THRESHOLD_OPTIONS.map(option => (
                  <label key={option.value} className="flex items-start gap-3 p-4 rounded-lg border border-border-default hover:bg-bg-secondary cursor-pointer transition-colors">
                    <RadioGroupItem value={option.value} className="mt-1" />
                    <div>
                      <p className="font-medium text-text-primary">{option.label}</p>
                      <p className="text-sm text-text-muted">{option.description}</p>
                    </div>
                  </label>
                ))}
              </div>
            </RadioGroup>
          </div>

          <Separator />

          <div className="space-y-4">
            <Label>Digest Frequency</Label>
            <RadioGroup value={localPrefs.digest_frequency} onValueChange={(v) => handleChange('digest_frequency', v as 'realtime' | 'hourly' | 'daily')}>
              <div className="space-y-3">
                {FREQUENCY_OPTIONS.map(option => (
                  <label key={option.value} className="flex items-start gap-3 p-4 rounded-lg border border-border-default hover:bg-bg-secondary cursor-pointer transition-colors">
                    <RadioGroupItem value={option.value} className="mt-1" />
                    <div>
                      <p className="font-medium text-text-primary">{option.label}</p>
                      <p className="text-sm text-text-muted">{option.description}</p>
                    </div>
                  </label>
                ))}
              </div>
            </RadioGroup>
          </div>

          <Separator />

          <div className="space-y-2">
            <Label htmlFor="email-address">Notification Email Address</Label>
            <Input
              id="email-address"
              type="email"
              value={localPrefs.email_address}
              onChange={(e) => handleChange('email_address', e.target.value)}
              placeholder="developer@app.com"
              disabled={saving}
            />
            <p className="text-sm text-text-muted">
              Emails will be sent to this address. Change your account email in Profile settings.
            </p>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-border-default">
            <Button variant="outline" onClick={handleTestEmail} disabled={saving || sendingTest} className="gap-2">
              <Send className="h-4 w-4" />
              {sendingTest ? 'Sending...' : 'Send Test Email'}
            </Button>
            <Button onClick={handleSave} disabled={saving} className="gap-2">
              <Save className="h-4 w-4" />
              {saving ? 'Saving...' : 'Save Preferences'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}