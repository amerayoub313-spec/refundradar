'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Copy, Check, Globe, AlertCircle, CheckCircle2, HelpCircle } from 'lucide-react';
import { toast } from 'sonner';
import type { RevenueCatConnectionStatus } from '@/types';

const WEBHOOK_BASE_URL = 'https://ingest.refundradar.io/webhook/revenuecat';
const REQUIRED_EVENTS = ['REFUND'];
const OPTIONAL_EVENTS = [
  'INITIAL_PURCHASE',
  'RENEWAL',
  'CANCELLATION',
  'EXPIRATION',
  'GRACE_PERIOD_EXPIRED',
  'BILLING_ISSUE',
  'PRODUCT_CHANGE',
];

interface WebhookConfigProps {
  status: RevenueCatConnectionStatus | null;
}

export function WebhookConfig({ status }: WebhookConfigProps) {
  const [copied, setCopied] = useState(false);

  const copyUrl = () => {
    navigator.clipboard.writeText(WEBHOOK_BASE_URL);
    setCopied(true);
    toast.success('Webhook URL copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Webhook URL */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Webhook Configuration
          </CardTitle>
          <CardDescription>
            Add this URL to your RevenueCat dashboard to receive real-time refund events.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Webhook Endpoint URL</Label>
            <div className="flex gap-2">
              <Input
                value={WEBHOOK_BASE_URL}
                readOnly
                className="flex-1 bg-bg-secondary"
              />
              <Button variant="outline" onClick={copyUrl} className="gap-2 whitespace-nowrap">
                {copied ? (
                  <>
                    <Check className="h-4 w-4" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" />
                    Copy
                  </>
                )}
              </Button>
            </div>
            <p className="text-sm text-text-muted">
              This URL receives all RevenueCat webhook events for your configured apps.
            </p>
          </div>

          <Separator />

          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <HelpCircle className="h-4 w-4 text-text-muted" />
              Events to Subscribe in RevenueCat
            </Label>
            
            <div className="space-y-2 ml-6">
              <p className="text-sm font-medium text-text-secondary">Required Events</p>
              {REQUIRED_EVENTS.map(event => (
                <Badge key={event} variant="outline" className="gap-2">
                  <CheckCircle2 className="h-3 w-3 text-risk-green-500" />
                  <code className="text-xs">{event}</code>
                  <span className="text-xs text-text-muted">(required for scoring)</span>
                </Badge>
              ))}
            </div>

            <div className="space-y-2 ml-6">
              <p className="text-sm font-medium text-text-secondary">Optional Events (for history & context)</p>
              {OPTIONAL_EVENTS.map(event => (
                <Badge key={event} variant="secondary" className="gap-2">
                  <code className="text-xs">{event}</code>
                </Badge>
              ))}
            </div>
          </div>

          <Separator />

          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-risk-yellow-500" />
              Setup Instructions
            </Label>
            <ol className="space-y-2 ml-6 text-sm text-text-secondary list-decimal">
              <li>Go to <a href="https://app.revenuecat.com" target="_blank" rel="noopener noreferrer" className="text-primary-500 hover:underline">RevenueCat Dashboard</a></li>
              <li>Navigate to your Project → Integrations → Webhooks</li>
              <li>Click "Add Webhook" and paste the URL above</li>
              <li>Select all events listed above (REFUND is required)</li>
              <li>Save the webhook configuration</li>
              <li>Return here and click "Test Connection" to verify</li>
            </ol>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}